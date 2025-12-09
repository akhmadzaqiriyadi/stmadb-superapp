// src/modules/pkl/journal/journal.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

const prisma = new PrismaClient();

interface CreateJournalInput {
  attendance_id: number;
  date: string;
  activities: string;
  learnings?: string;
  challenges?: string;
  self_rating?: number;
  photos?: string[]; // Add photos support
}

interface UpdateJournalInput {
  activities?: string;
  learnings?: string;
  challenges?: string;
  self_rating?: number;
}

interface GetJournalsFilters {
  page?: number;
  limit?: number;
  status?: 'Draft' | 'Submitted';
  student_id?: number;
  assignment_id?: number;
  start_date?: string;
  end_date?: string;
}

// ===== CREATE JOURNAL =====
export const createJournal = async (userId: number, data: CreateJournalInput) => {
  // 1. Validate attendance exists and belongs to user
  const attendance = await prisma.pKLAttendance.findUnique({
    where: { id: data.attendance_id },
    include: {
      pkl_assignment: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!attendance) {
    throw new Error('Attendance tidak ditemukan');
  }

  if (attendance.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke attendance ini');
  }

  // 2. Check if assignment is still active
  if (attendance.pkl_assignment.status !== 'Active') {
    throw new Error('Assignment sudah tidak aktif');
  }

  // 3. Check if journal already exists for this attendance
  const existingJournal = await prisma.pKLJournal.findFirst({
    where: { attendance_id: data.attendance_id },
  });

  if (existingJournal) {
    throw new Error('Journal untuk attendance ini sudah ada');
  }

  // 4. Additional check: Ensure only 1 journal per day per assignment
  const journalDate = startOfDay(parseISO(data.date));
  const nextDay = endOfDay(parseISO(data.date));

  const existingJournalForDay = await prisma.pKLJournal.findFirst({
    where: {
      pkl_assignment_id: attendance.pkl_assignment_id,
      date: {
        gte: journalDate,
        lte: nextDay,
      },
    },
  });

  if (existingJournalForDay) {
    throw new Error('Anda sudah mengisi jurnal untuk tanggal ini');
  }

  // 5. Create journal with photos
  return prisma.pKLJournal.create({
    data: {
      pkl_assignment_id: attendance.pkl_assignment_id,
      attendance_id: data.attendance_id,
      date: journalDate, // Use startOfDay for consistency
      activities: data.activities,
      learnings: data.learnings ?? null,
      challenges: data.challenges ?? null,
      self_rating: data.self_rating ?? null,
      photos: data.photos && data.photos.length > 0 ? (data.photos as any) : null, // Save photos if provided
      status: 'Draft',
    },
    include: {
      pkl_assignment: {
        include: {
          student: {
            include: {
              profile: true,
            },
          },
          industry: true,
        },
      },
      attendance: true,
    },
  });
};

// ===== UPDATE JOURNAL =====
export const updateJournal = async (
  userId: number,
  journalId: number,
  data: UpdateJournalInput
) => {
  // 1. Get journal with assignment
  const journal = await prisma.pKLJournal.findUnique({
    where: { id: journalId },
    include: {
      pkl_assignment: true,
    },
  });

  if (!journal) {
    throw new Error('Journal tidak ditemukan');
  }

  // 2. Check ownership
  if (journal.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  // 3. Can only update Draft
  if (journal.status !== 'Draft') {
    throw new Error('Hanya journal dengan status Draft yang dapat diubah');
  }

  // 4. Build update data
  const updateData: Prisma.PKLJournalUpdateInput = {};
  if (data.activities !== undefined) updateData.activities = data.activities;
  if (data.learnings !== undefined) updateData.learnings = data.learnings;
  if (data.challenges !== undefined) updateData.challenges = data.challenges;
  if (data.self_rating !== undefined) updateData.self_rating = data.self_rating;

  // 5. Update journal
  return prisma.pKLJournal.update({
    where: { id: journalId },
    data: updateData,
    include: {
      pkl_assignment: {
        include: {
          student: {
            include: {
              profile: true,
            },
          },
          industry: true,
        },
      },
      attendance: true,
    },
  });
};

// ===== SUBMIT JOURNAL =====
export const submitJournal = async (userId: number, journalId: number) => {
  // 1. Get journal
  const journal = await prisma.pKLJournal.findUnique({
    where: { id: journalId },
    include: {
      pkl_assignment: true,
    },
  });

  if (!journal) {
    throw new Error('Journal tidak ditemukan');
  }

  // 2. Check ownership
  if (journal.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  // 3. Can only submit Draft
  if (journal.status !== 'Draft') {
    throw new Error('Journal dengan status Draft saja yang dapat disubmit');
  }

  // 4. Validate required fields
  if (!journal.activities || journal.activities.length < 10) {
    throw new Error('Deskripsi aktivitas minimal 10 karakter');
  }

  // 5. Submit journal
  return prisma.pKLJournal.update({
    where: { id: journalId },
    data: {
      status: 'Submitted',
      submitted_at: new Date(),
    },
    include: {
      pkl_assignment: {
        include: {
          student: {
            include: {
              profile: true,
            },
          },
          industry: true,
          school_supervisor: {
            include: {
              profile: true,
            },
          },
        },
      },
      attendance: true,
    },
  });
};

// ===== UPLOAD PHOTOS =====
export const uploadPhotos = async (userId: number, journalId: number, photoUrls: string[]) => {
  // 1. Get journal
  const journal = await prisma.pKLJournal.findUnique({
    where: { id: journalId },
    include: {
      pkl_assignment: true,
    },
  });

  if (!journal) {
    throw new Error('Journal tidak ditemukan');
  }

  // 2. Check ownership
  if (journal.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  // 3. Get existing photos
  const existingPhotos = (journal.photos as string[]) || [];
  
  // 4. Check limit (max 5 photos total)
  if (existingPhotos.length + photoUrls.length > 5) {
    throw new Error(`Maksimal 5 foto. Saat ini: ${existingPhotos.length}, upload: ${photoUrls.length}`);
  }

  // 5. Append new photos
  const allPhotos = [...existingPhotos, ...photoUrls];

  // 6. Update journal
  return prisma.pKLJournal.update({
    where: { id: journalId },
    data: {
      photos: allPhotos as any, // Cast to any to handle Json type
    },
    include: {
      pkl_assignment: {
        include: {
          student: {
            include: {
              profile: true,
            },
          },
          industry: true,
        },
      },
      attendance: true,
    },
  });
};

// ===== DELETE PHOTO =====
export const deletePhoto = async (userId: number, journalId: number, photoUrl: string) => {
  // 1. Get journal
  const journal = await prisma.pKLJournal.findUnique({
    where: { id: journalId },
    include: {
      pkl_assignment: true,
    },
  });

  if (!journal) {
    throw new Error('Journal tidak ditemukan');
  }

  // 2. Check ownership
  if (journal.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  // 3. Get existing photos
  const existingPhotos = (journal.photos as string[]) || [];
  
  // 4. Remove photo
  const updatedPhotos = existingPhotos.filter(url => url !== photoUrl);

  // 5. Update journal
  return prisma.pKLJournal.update({
    where: { id: journalId },
    data: {
      photos: updatedPhotos.length > 0 ? (updatedPhotos as any) : null,
    },
    include: {
      pkl_assignment: {
        include: {
          student: {
            include: {
              profile: true,
            },
          },
          industry: true,
        },
      },
      attendance: true,
    },
  });
};

// ===== GET JOURNALS (List with Filters) =====
export const getJournals = async (userId: number, userRole: string, filters: GetJournalsFilters) => {
  const {
    page = 1,
    limit = 10,
    status,
    student_id,
    assignment_id,
    start_date,
    end_date,
  } = filters;

  const skip = (page - 1) * limit;

  // Build where condition based on role
  const whereCondition: Prisma.PKLJournalWhereInput = {};

  // Role-based filtering
  if (userRole === 'Student') {
    whereCondition.pkl_assignment = {
      student_user_id: userId,
    } as Prisma.PKLAssignmentWhereInput;
  } else if (userRole === 'Teacher') {
    whereCondition.pkl_assignment = {
      school_supervisor_id: userId,
    } as Prisma.PKLAssignmentWhereInput;
  }
  // Admin can see all

  // Additional filters
  if (status) {
    whereCondition.status = status;
  }

  if (student_id && (userRole === 'Teacher' || userRole === 'Admin')) {
    whereCondition.pkl_assignment = {
      ...(whereCondition.pkl_assignment as object),
      student_user_id: student_id,
    } as Prisma.PKLAssignmentWhereInput;
  }

  if (assignment_id) {
    whereCondition.pkl_assignment_id = assignment_id;
  }

  if (start_date || end_date) {
    whereCondition.date = {};
    if (start_date) {
      whereCondition.date.gte = new Date(start_date);
    }
    if (end_date) {
      whereCondition.date.lte = new Date(end_date);
    }
  }

  const [journals, total] = await Promise.all([
    prisma.pKLJournal.findMany({
      where: whereCondition,
      skip,
      take: limit,
      include: {
        pkl_assignment: {
          include: {
            student: {
              include: {
                profile: true,
              },
            },
            industry: true,
          },
        },
        attendance: true,
      },
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.pKLJournal.count({ where: whereCondition }),
  ]);

  return {
    data: journals,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// ===== GET JOURNAL BY ID =====
export const getJournalById = async (userId: number, userRole: string, journalId: number) => {
  const journal = await prisma.pKLJournal.findUnique({
    where: { id: journalId },
    include: {
      pkl_assignment: {
        include: {
          student: {
            include: {
              profile: true,
            },
          },
          industry: true,
          school_supervisor: {
            include: {
              profile: true,
            },
          },
        },
      },
      attendance: true,
    },
  });

  if (!journal) {
    throw new Error('Journal tidak ditemukan');
  }

  // Role-based access control
  if (userRole === 'Student' && journal.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  if (userRole === 'Teacher' && journal.pkl_assignment.school_supervisor_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  return journal;
};

// ===== DELETE JOURNAL =====
export const deleteJournal = async (userId: number, journalId: number) => {
  // 1. Get journal
  const journal = await prisma.pKLJournal.findUnique({
    where: { id: journalId },
    include: {
      pkl_assignment: true,
    },
  });

  if (!journal) {
    throw new Error('Journal tidak ditemukan');
  }

  // 2. Check ownership
  if (journal.pkl_assignment.student_user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke journal ini');
  }

  // 3. Can only delete Draft journals
  if (journal.status !== 'Draft') {
    throw new Error('Hanya journal dengan status Draft yang dapat dihapus');
  }

  // 4. Delete journal
  return prisma.pKLJournal.delete({
    where: { id: journalId },
  });
};

// ===== GET MY JOURNALS (Student Helper) =====
export const getMyJournals = async (userId: number, filters?: Partial<GetJournalsFilters>) => {
  return getJournals(userId, 'Student', filters || {});
};

// ===== GET SUPERVISED JOURNALS (Teacher Helper) =====
export const getSupervisedJournals = async (teacherId: number, filters?: Partial<GetJournalsFilters>) => {
  return getJournals(teacherId, 'Teacher', filters || {});
};
