import { PrismaClient } from '@prisma/client';
import { addMinutes, isWithinInterval, format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { CreateTeachingJournalDto, GetMyJournalsQuery, GetAdminJournalsQuery, GetMissingJournalsQuery } from './teaching-journal.validation.js';
import { deleteJournalPhoto, getJournalPhotoUrl } from '../../../core/config/multer.config.js';

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
  private readonly GRACE_BEFORE = 15; // 15 menit sebelum
  private readonly GRACE_AFTER = 30;  // 30 menit setelah
  
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
    
    // 2. Get current time
    const now = new Date();
    const currentDay = format(now, 'EEEE', { locale: localeId });
    const currentTime = format(now, 'HH:mm');
    
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
}

export const teachingJournalService = new TeachingJournalService();
