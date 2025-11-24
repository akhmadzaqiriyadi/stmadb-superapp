import { PrismaClient } from '@prisma/client';
import { addMinutes, isWithinInterval, format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { CreateTeachingJournalDto, GetMyJournalsQuery, GetAdminJournalsQuery, GetMissingJournalsQuery, ExportJournalsQuery } from './teaching-journal.validation.js';
import { deleteJournalPhoto, getJournalPhotoUrl } from '../../../core/config/multer.config.js';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

interface TimeValidationResult {
  isValid: boolean;
  message?: string;
  schedule?: {
    start_time: string;
    end_time: string;
    day_of_week: string;
  };
}

export class TeachingJournalService {
  
  // Grace period dalam menit
  // Untuk jadwal panjang (misal 07:00-15:30), guru bisa isi jurnal selama jam pelajaran berlangsung
  private readonly GRACE_BEFORE = 30; // 30 menit sebelum mulai
  private readonly GRACE_AFTER = 120; // 2 jam setelah selesai (untuk antisipasi keterlambatan isi jurnal)
  
  // Testing mode: disable time validation (set DISABLE_TIME_VALIDATION=true di .env)
  private readonly DISABLE_TIME_VALIDATION = process.env.DISABLE_TIME_VALIDATION === 'true';
  
  /**
   * Validasi apakah guru bisa mengisi jurnal saat ini
   */
  async validateJournalTiming(
    scheduleId: number,
    teacherId: number
  ): Promise<TimeValidationResult> {
    
    // 1. Get schedule info
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        assignment: {
          teacher_user_id: teacherId
        },
        academic_year: {
          is_active: true
        }
      },
      include: {
        assignment: {
          include: {
            subject: true,
            class: true,
            teacher: {
              select: {
                profile: {
                  select: {
                    full_name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!schedule) {
      return {
        isValid: false,
        message: 'Jadwal tidak ditemukan atau Anda tidak memiliki akses'
      };
    }
    
    // TESTING MODE: Skip time validation
    if (this.DISABLE_TIME_VALIDATION) {
      return {
        isValid: true,
        message: '✅ [TESTING MODE] Validasi waktu dinonaktifkan - bisa isi kapan saja',
        schedule: {
          start_time: format(schedule.start_time, 'HH:mm'),
          end_time: format(schedule.end_time, 'HH:mm'),
          day_of_week: schedule.day_of_week
        }
      };
    }
    
    // 2. Get current time and day in Jakarta timezone
    // Server timezone might be UTC, so we need to convert to WIB (UTC+7)
    const now = new Date();
    
    // Convert to Jakarta timezone (WIB/UTC+7)
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    
    // Mapping hari dalam bahasa Indonesia (case-insensitive compare)
    const dayMap: Record<number, string> = {
      0: 'Minggu',
      1: 'Senin', 
      2: 'Selasa',
      3: 'Rabu',
      4: 'Kamis',
      5: 'Jumat',
      6: 'Sabtu'
    };
    
    const currentDay = dayMap[jakartaTime.getDay()];
    const currentTime = format(jakartaTime, 'HH:mm');
    
    console.log('🕐 Timezone Debug:');
    console.log('  - Server time:', now.toISOString());
    console.log('  - Jakarta time:', jakartaTime.toISOString());
    console.log('  - Detected day:', currentDay);
    console.log('  - Schedule day:', schedule.day_of_week);
    
    // 3. Validate day of week
    if (schedule.day_of_week !== currentDay) {
      return {
        isValid: false,
        message: `Jadwal ini untuk hari ${schedule.day_of_week}, bukan hari ini (${currentDay})`,
        schedule: {
          start_time: format(schedule.start_time, 'HH:mm'),
          end_time: format(schedule.end_time, 'HH:mm'),
          day_of_week: schedule.day_of_week
        }
      };
    }
    
    // 4. Parse schedule times
    const scheduleStartStr = format(schedule.start_time, 'HH:mm');
    const scheduleEndStr = format(schedule.end_time, 'HH:mm');
    const scheduleStart = parseISO(`1970-01-01T${scheduleStartStr}`);
    const scheduleEnd = parseISO(`1970-01-01T${scheduleEndStr}`);
    const currentTimeDate = parseISO(`1970-01-01T${currentTime}`);
    
    // 5. Apply grace period
    const allowedStart = addMinutes(scheduleStart, -this.GRACE_BEFORE);
    const allowedEnd = addMinutes(scheduleEnd, this.GRACE_AFTER);
    
    // 6. Check if current time is within allowed interval
    const isWithinTime = isWithinInterval(currentTimeDate, {
      start: allowedStart,
      end: allowedEnd
    });
    
    if (!isWithinTime) {
      const allowedStartStr = format(allowedStart, 'HH:mm');
      const allowedEndStr = format(allowedEnd, 'HH:mm');
      
      return {
        isValid: false,
        message: `Jurnal hanya dapat diisi pada jam ${allowedStartStr} - ${allowedEndStr}. Sekarang: ${currentTime}`,
        schedule: {
          start_time: format(schedule.start_time, 'HH:mm'),
          end_time: format(schedule.end_time, 'HH:mm'),
          day_of_week: schedule.day_of_week
        }
      };
    }
    
    // 7. All validation passed
    return {
      isValid: true,
      message: 'Waktu valid untuk mengisi jurnal',
      schedule: {
        start_time: format(schedule.start_time, 'HH:mm'),
        end_time: format(schedule.end_time, 'HH:mm'),
        day_of_week: schedule.day_of_week
      }
    };
  }
  
  /**
   * Create teaching journal
   */
  async createJournal(data: CreateTeachingJournalDto, teacherId: number, files?: Express.Multer.File[]) {
    const { schedule_id, journal_date } = data;
    
    if (!teacherId || typeof teacherId !== 'number') {
      throw new Error('Teacher ID is required and must be a number');
    }
    
    // 1. Validate timing
    const validation = await this.validateJournalTiming(schedule_id, teacherId);
    
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    // 2. Validate journal date = today
    const today = format(new Date(), 'yyyy-MM-dd');
    const journalDateStr = format(new Date(journal_date), 'yyyy-MM-dd');
    
    if (journalDateStr !== today) {
      throw new Error('Jurnal hanya dapat diisi untuk hari ini');
    }
    
    // 3. Check duplicate
    const existingJournal = await prisma.teachingJournal.findUnique({
      where: {
        schedule_id_journal_date: {
          schedule_id,
          journal_date: new Date(journal_date)
        }
      }
    });
    
    if (existingJournal) {
      throw new Error('Jurnal untuk jadwal ini sudah dibuat');
    }
    
    // 4. Get schedule to get class_id and find matching daily attendance session
    const schedule = await prisma.schedule.findUnique({
      where: { id: schedule_id },
      include: {
        assignment: {
          include: {
            class: true
          }
        }
      }
    });
    
    if (!schedule) {
      throw new Error('Jadwal tidak ditemukan');
    }
    
    // 5. Try to find existing daily attendance session for this class and date
    const dailySession = await prisma.dailyAttendanceSession.findFirst({
      where: {
        class_id: schedule.assignment!.class_id,
        session_date: {
          gte: startOfDay(new Date(journal_date)),
          lte: endOfDay(new Date(journal_date))
        }
      }
    });
    
    // 6. Create journal with photos and link to daily session if exists
    const journal = await prisma.teachingJournal.create({
      data: {
        schedule_id,
        teacher_user_id: teacherId,
        journal_date: new Date(journal_date),
        teacher_status: data.teacher_status,
        teacher_notes: data.teacher_notes ?? null,
        material_topic: data.material_topic ?? null,
        material_description: data.material_description ?? null,
        learning_method: data.learning_method ?? null,
        learning_media: data.learning_media ?? null,
        learning_achievement: data.learning_achievement ?? null,
        reflection_notes: data.reflection_notes ?? null,
        
        // Link to daily session if exists
        daily_session_id: dailySession?.id ?? null,
      },
      include: {
        schedule: {
          include: {
            assignment: {
              include: {
                subject: true,
                class: true,
                teacher: {
                  select: {
                    profile: {
                      select: {
                        full_name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        photos: true,
        daily_session: {
          include: {
            student_attendances: {
              include: {
                student: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // 7. Upload photos if provided
    if (files && files.length > 0) {
      await prisma.journalPhoto.createMany({
        data: files.map(file => ({
          journal_id: journal.id,
          photo_url: getJournalPhotoUrl(file.filename),
          filename: file.filename
        }))
      });
      
      // Refetch to include photos
      const updatedJournal = await prisma.teachingJournal.findUnique({
        where: { id: journal.id },
        include: {
          schedule: {
            include: {
              assignment: {
                include: {
                  subject: true,
                  class: true,
                  teacher: {
                    select: {
                      profile: {
                        select: {
                          full_name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          photos: true,
          daily_session: {
            include: {
              student_attendances: {
                include: {
                  student: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      return updatedJournal!;
    }
    
    return journal;
  }
  
  /**
   * Get my journals (teacher)
   */
  async getMyJournals(teacherId: number, query: GetMyJournalsQuery) {
    const { page = 1, limit = 10, search, date_from, date_to, class_id, teacher_status } = query;
    
    // Convert to numbers (query params are strings)
    const pageNum = typeof page === 'string' ? parseInt(page) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {
      teacher_user_id: teacherId
    };
    
    if (search) {
      where.OR = [
        {
          schedule: {
            subject: {
              subject_name: { contains: search, mode: 'insensitive' }
            }
          }
        },
        {
          schedule: {
            class: {
              class_name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
    }
    
    if (date_from && date_to) {
      where.journal_date = {
        gte: new Date(date_from),
        lte: new Date(date_to)
      };
    }
    
    if (class_id) {
      where.schedule = {
        assignment: {
          class_id
        }
      };
    }
    
    if (teacher_status) {
      where.teacher_status = teacher_status;
    }
    
    const [journals, total] = await Promise.all([
      prisma.teachingJournal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { journal_date: 'desc' },
        include: {
          schedule: {
            include: {
              assignment: {
                include: {
                  subject: true,
                  class: true
                }
              }
            }
          },
          photos: true,
          daily_session: {
            include: {
              student_attendances: {
                include: {
                  student: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.teachingJournal.count({ where })
    ]);
    
    // Calculate attendance stats for each journal from daily_session
    const journalsWithStats = journals.map((journal: any) => {
      const attendances = journal.daily_session?.student_attendances ?? [];
      const total = attendances.length;
      const hadir = attendances.filter((a: any) => a.status === 'Hadir').length;
      const sakit = attendances.filter((a: any) => a.status === 'Sakit').length;
      const izin = attendances.filter((a: any) => a.status === 'Izin').length;
      const alfa = attendances.filter((a: any) => a.status === 'Alfa').length;
      
      return {
        ...journal,
        attendance_stats: {
          total,
          hadir,
          sakit,
          izin,
          alfa,
          rate: total > 0 ? ((hadir / total) * 100).toFixed(1) : '0'
        }
      };
    });
    
    return {
      data: journalsWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }
  
  /**
   * Get journal detail
   */
  async getJournalDetail(journalId: number, userId: number, userRole: string) {
    const journal = await prisma.teachingJournal.findUnique({
      where: { id: journalId },
      include: {
        schedule: {
          include: {
            assignment: {
              include: {
                subject: true,
                class: true,
                teacher: {
                  include: { profile: true }
                }
              }
            }
          }
        },
        photos: true,
        daily_session: {
          include: {
            student_attendances: {
              include: {
                student: {
                  include: { profile: true }
                }
              },
              orderBy: {
                student: {
                  profile: {
                    full_name: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!journal) {
      throw new Error('Jurnal tidak ditemukan');
    }
    
    // Authorization: teacher can only see their own journal
    if (userRole === 'Guru' && journal.teacher_user_id !== userId) {
      throw new Error('Anda tidak memiliki akses ke jurnal ini');
    }
    
    // Calculate stats from daily_session
    const attendances = journal.daily_session?.student_attendances ?? [];
    const stats = {
      total: attendances.length,
      hadir: attendances.filter((a: any) => a.status === 'Hadir').length,
      sakit: attendances.filter((a: any) => a.status === 'Sakit').length,
      izin: attendances.filter((a: any) => a.status === 'Izin').length,
      alfa: attendances.filter((a: any) => a.status === 'Alfa').length,
      rate: attendances.length > 0 
        ? ((attendances.filter((a: any) => a.status === 'Hadir').length / attendances.length) * 100).toFixed(1) 
        : '0'
    };
    
    return {
      ...journal,
      attendance_stats: stats
    };
  }
  
  /**
   * Delete journal (and cascade photos)
   */
  async deleteJournal(journalId: number, teacherId: number) {
    const journal = await prisma.teachingJournal.findUnique({
      where: { id: journalId },
      include: { photos: true }
    });
    
    if (!journal) {
      throw new Error('Jurnal tidak ditemukan');
    }
    
    if (journal.teacher_user_id !== teacherId) {
      throw new Error('Anda tidak memiliki akses');
    }
    
    // Delete photos from filesystem
    journal.photos.forEach(photo => {
      deleteJournalPhoto(photo.filename);
    });
    
    // Delete journal (cascade delete photos and attendances)
    await prisma.teachingJournal.delete({
      where: { id: journalId }
    });
    
    return { success: true };
  }
  
  // ===== ADMIN ENDPOINTS =====
  
  /**
   * Get admin statistics
   */
  async getAdminStatistics() {
    const today = startOfDay(new Date());
    const endToday = endOfDay(new Date());
    const startThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const endThisWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const [totalJournals, thisWeekJournals, todayJournals] = await Promise.all([
      prisma.teachingJournal.count(),
      prisma.teachingJournal.count({
        where: {
          journal_date: {
            gte: startThisWeek,
            lte: endThisWeek
          }
        }
      }),
      prisma.teachingJournal.count({
        where: {
          journal_date: {
            gte: today,
            lte: endToday
          }
        }
      })
    ]);
    
    return {
      total_journals: totalJournals,
      this_week: thisWeekJournals,
      today: todayJournals
    };
  }
  
  /**
   * Get all journals (admin)
   */
  async getAllJournals(query: GetAdminJournalsQuery) {
    const { page = 1, limit = 20, search, date_from, date_to, teacher_id, subject_id, class_id, teacher_status } = query;
    
    // Convert to numbers (query params are strings)
    const pageNum = typeof page === 'string' ? parseInt(page) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { schedule: { assignment: { subject: { subject_name: { contains: search, mode: 'insensitive' } } } } },
        { schedule: { assignment: { class: { class_name: { contains: search, mode: 'insensitive' } } } } },
        { schedule: { assignment: { teacher: { profile: { full_name: { contains: search, mode: 'insensitive' } } } } } }
      ];
    }
    
    if (date_from && date_to) {
      where.journal_date = { gte: new Date(date_from), lte: new Date(date_to) };
    }
    
    if (teacher_id) where.teacher_user_id = teacher_id;
    if (teacher_status) where.teacher_status = teacher_status;
    if (subject_id) where.schedule = { ...where.schedule, assignment: { subject_id } };
    if (class_id) where.schedule = { ...where.schedule, assignment: { class_id } };
    
    const [journals, total] = await Promise.all([
      prisma.teachingJournal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { journal_date: 'desc' },
        include: {
          schedule: {
            include: {
              assignment: {
                include: {
                  subject: true,
                  class: true,
                  teacher: { include: { profile: true } }
                }
              }
            }
          },
          photos: true,
          daily_session: {
            include: {
              student_attendances: true
            }
          }
        }
      }),
      prisma.teachingJournal.count({ where })
    ]);
    
    return {
      data: journals,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    };
  }
  
  /**
   * Get missing journals
   */
  async getMissingJournals(query: GetMissingJournalsQuery) {
    const { period } = query;
    
    let dateStart: Date;
    let dateEnd: Date;
    
    if (period === 'today') {
      dateStart = startOfDay(new Date());
      dateEnd = endOfDay(new Date());
    } else if (period === 'this_week') {
      dateStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      dateEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else {
      dateStart = startOfMonth(new Date());
      dateEnd = endOfMonth(new Date());
    }
    
    // Get all schedules in period
    const currentDay = format(new Date(), 'EEEE', { locale: localeId }) as any; // Cast to bypass enum check
    
    const schedules = await prisma.schedule.findMany({
      where: {
        day_of_week: currentDay,
        academic_year: { is_active: true }
      },
      include: {
        assignment: {
          include: {
            subject: true,
            class: true,
            teacher: { include: { profile: true } }
          }
        }
      }
    });
    
    // Check which ones don't have journals
    const missing = [];
    
    for (const schedule of schedules) {
      const journal = await prisma.teachingJournal.findFirst({
        where: {
          schedule_id: schedule.id,
          journal_date: {
            gte: dateStart,
            lte: dateEnd
          }
        }
      });
      
      if (!journal) {
        const daysOverdue = Math.floor((Date.now() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
        
        missing.push({
          teacher: schedule.assignment.teacher,
          schedule: {
            subject_name: schedule.assignment.subject.subject_name,
            class_name: schedule.assignment.class.class_name,
            day_of_week: schedule.day_of_week,
            start_time: format(schedule.start_time, 'HH:mm')
          },
          days_overdue: daysOverdue,
          journal_date: dateStart
        });
      }
    }
    
    return missing;
  }

  /**
   * Export journals to Excel
   */
  async exportJournals(query: ExportJournalsQuery, userRole?: string, userId?: number): Promise<ExcelJS.Buffer> {
    const { date_from, date_to, teacher_id, class_id, subject_id } = query;

    // Build where clause
    const whereClause: any = {
      journal_date: {
        gte: parseISO(date_from),
        lte: parseISO(date_to)
      }
    };

    // If role is TEACHER, only show own journals
    if (userRole === 'TEACHER' && userId) {
      whereClause.schedule = {
        assignment: {
          teacher_user_id: userId
        }
      };
    } else {
      // Admin can filter by teacher_id
      if (teacher_id) {
        whereClause.schedule = {
          assignment: {
            teacher_user_id: teacher_id
          }
        };
      }
    }

    // Filter by class_id
    if (class_id) {
      whereClause.schedule = {
        ...whereClause.schedule,
        assignment: {
          ...whereClause.schedule?.assignment,
          class_id: class_id
        }
      };
    }

    // Filter by subject_id
    if (subject_id) {
      whereClause.schedule = {
        ...whereClause.schedule,
        assignment: {
          ...whereClause.schedule?.assignment,
          subject_id: subject_id
        }
      };
    }

    // Fetch journals
    const journals = await prisma.teachingJournal.findMany({
      where: whereClause,
      include: {
        schedule: {
          include: {
            assignment: {
              include: {
                teacher: {
                  select: {
                    profile: {
                      select: {
                        full_name: true
                      }
                    }
                  }
                },
                subject: true,
                class: true
              }
            }
          }
        },
        daily_session: {
          include: {
            student_attendances: {
              include: {
                student: {
                  select: {
                    profile: {
                      select: {
                        full_name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        photos: true
      },
      orderBy: [
        { journal_date: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Jurnal KBM');

    // Add title rows (merged cells)
    worksheet.mergeCells('A1:K1');
    worksheet.getCell('A1').value = 'JURNAL KEGIATAN PEMBELAJARAN GURU';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    
    worksheet.mergeCells('A2:K2');
    worksheet.getCell('A2').value = 'SMKN 1 ADIWERNA TAHUN PELAJARAN 2024/2025';
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add empty row
    worksheet.addRow([]);
    
    // Add teacher info
    const firstJournal = journals[0];
    const teacherName = firstJournal?.schedule?.assignment?.teacher?.profile?.full_name || 'Semua Guru';
    
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Nama';
    worksheet.getCell('A4').font = { bold: true };
    worksheet.mergeCells('C4:K4');
    worksheet.getCell('C4').value = `: ${teacherName}`;
    
    worksheet.mergeCells('A5:B5');
    worksheet.getCell('A5').value = 'NIP';
    worksheet.getCell('A5').font = { bold: true };
    worksheet.mergeCells('C5:K5');
    worksheet.getCell('C5').value = ': ......';
    
    // Add empty row
    worksheet.addRow([]);

    // Define header row (row 7)
    const headerRow = worksheet.getRow(7);
    headerRow.values = [
      'No',
      'Tanggal',
      'Mata Pelajaran',
      'Kelas',
      'Status Kehadiran',
      'Topik',
      'Deskripsi',
      'Metode',
      'Refleksi / Catatan',
      'H',
      'I',
      'S',
      'A',
      'Link Foto'
    ];
    
    // Style header row
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;
    
    // Set column widths
    worksheet.columns = [
      { key: 'no', width: 5 },
      { key: 'tanggal', width: 12 },
      { key: 'mata_pelajaran', width: 20 },
      { key: 'kelas', width: 10 },
      { key: 'status_kehadiran', width: 15 },
      { key: 'topik', width: 30 },
      { key: 'deskripsi', width: 35 },
      { key: 'metode', width: 20 },
      { key: 'refleksi', width: 35 },
      { key: 'h', width: 5 },
      { key: 'i', width: 5 },
      { key: 's', width: 5 },
      { key: 'a', width: 5 },
      { key: 'link_foto', width: 15 }
    ];

    // Add data rows
    journals.forEach((journal, index) => {
      const schedule = journal.schedule;
      const assignment = schedule?.assignment;
      
      // Skip if assignment is missing
      if (!assignment) {
        return;
      }
      
      // Calculate attendance stats
      let presentCount = 0;
      let sickCount = 0;
      let permissionCount = 0;
      let absentCount = 0;
      
      if (journal.daily_session?.student_attendances) {
        journal.daily_session.student_attendances.forEach((att: any) => {
          switch (att.status) {
            case 'Hadir': presentCount++; break;
            case 'Sakit': sickCount++; break;
            case 'Izin': permissionCount++; break;
            case 'Alfa': absentCount++; break;
          }
        });
      }

      // Translate learning method to Indonesian
      const methodTranslation: Record<string, string> = {
        'Ceramah': 'Ceramah',
        'Diskusi': 'Diskusi',
        'Praktik': 'Praktik',
        'Demonstrasi': 'Demonstrasi',
        'Eksperimen': 'Eksperimen',
        'PresentasiSiswa': 'Presentasi Siswa',
        'TanyaJawab': 'Tanya Jawab',
        'PembelajaranKelompok': 'Pembelajaran Kelompok',
        'Proyek': 'Proyek',
        'ProblemSolving': 'Problem Solving'
      };
      
      // Status kehadiran guru
      const statusMapping: Record<string, string> = {
        'Hadir': 'Hadir',
        'Sakit': 'Sakit',
        'Izin': 'Izin/DL',
        'Alpa': 'Sakit'
      };
      
      // Link foto (ambil foto pertama jika ada)
      const photoLink = journal.photos?.[0]?.photo_url || '-';

      const row = worksheet.addRow({
        no: index + 1,
        tanggal: format(journal.journal_date, 'dd/MM/yyyy'),
        mata_pelajaran: assignment.subject?.subject_name || '-',
        kelas: assignment.class?.class_name || '-',
        status_kehadiran: statusMapping[journal.teacher_status] || journal.teacher_status,
        topik: journal.material_topic || '-',
        deskripsi: journal.material_description || '-',
        metode: journal.learning_method ? methodTranslation[journal.learning_method] : '-',
        refleksi: journal.reflection_notes || journal.teacher_notes || '-',
        h: presentCount,
        i: permissionCount,
        s: sickCount,
        a: absentCount,
        link_foto: photoLink
      });
      
      // Align text
      row.alignment = { vertical: 'top', wrapText: true };
      row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }; // H
      row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' }; // I
      row.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' }; // S
      row.getCell(13).alignment = { horizontal: 'center', vertical: 'middle' }; // A
    });

    // Apply borders to all cells (from row 7 onwards)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 7) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as ExcelJS.Buffer;
  }
}

export const teachingJournalService = new TeachingJournalService();
