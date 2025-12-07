// src/modules/pkl/journal/journal.controller.ts

import type { Request, Response } from 'express';
import * as journalService from './journal.service.js';

// ===== CREATE JOURNAL =====
export const createJournal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    // If attendance_id not provided, get today's attendance
    let data = req.body;
    if (!data.attendance_id) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await prisma.pKLAttendance.findFirst({
        where: {
          pkl_assignment: {
            student_user_id: userId,
            status: 'Active',
          },
          date: today,
          tap_in_time: { not: null },
        },
      });
      
      if (!attendance) {
        return res.status(400).json({ message: 'Belum tap in hari ini' });
      }
      
      data = { ...data, attendance_id: attendance.id };
    }

    // Map frontend field names to backend
    const mappedData = {
      attendance_id: data.attendance_id,
      date: data.date,
      activities: data.activities,
      learnings: data.learning_points || data.learnings,
      challenges: data.obstacles || data.challenges,
      self_rating: data.self_rating,
    };

    const journal = await journalService.createJournal(userId, mappedData);

    res.status(201).json({
      message: 'Journal berhasil dibuat',
      data: journal,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== UPDATE JOURNAL =====
export const updateJournal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Journal ID dibutuhkan' });
    }

    const journalId = parseInt(req.params.id, 10);
    const journal = await journalService.updateJournal(userId, journalId, req.body);

    res.status(200).json({
      message: 'Journal berhasil diperbarui',
      data: journal,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== SUBMIT JOURNAL =====
export const submitJournal = async (req: Request, res: Response) => {
  console.log('=== SUBMIT JOURNAL CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Params:', req.params);
  console.log('User:', req.user);
  
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.log('ERROR: No userId');
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!req.params.id) {
      console.log('ERROR: No journal ID in params');
      return res.status(400).json({ message: 'Journal ID dibutuhkan' });
    }

    const journalId = parseInt(req.params.id, 10);
    console.log('Submitting journal ID:', journalId);
    
    const journal = await journalService.submitJournal(userId, journalId);

    console.log('Submit successful!');
    res.status(200).json({
      message: 'Journal berhasil disubmit',
      data: journal,
    });
  } catch (error: any) {
    console.error('Submit error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

// ===== UPLOAD PHOTOS =====
export const uploadPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!req.params.journalId) {
      return res.status(400).json({ message: 'Journal ID dibutuhkan' });
    }

    const journalId = parseInt(req.params.journalId, 10);

    // Get uploaded files
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    // Import helper function
    const { getJournalPhotoUrl } = await import('../../../core/config/multer.config.js');
    
    // Get photo URLs from uploaded files
    const photoUrls = files.map(file => getJournalPhotoUrl(file.filename));

    const journal = await journalService.uploadPhotos(userId, journalId, photoUrls);

    res.status(201).json({
      message: `${files.length} foto berhasil diupload`,
      data: journal,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== DELETE PHOTO =====
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!req.params.journalId) {
      return res.status(400).json({ message: 'Journal ID dibutuhkan' });
    }

    const journalId = parseInt(req.params.journalId, 10);
    const { photo_url } = req.body;

    if (!photo_url) {
      return res.status(400).json({ message: 'URL foto dibutuhkan' });
    }

    const journal = await journalService.deletePhoto(userId, journalId, photo_url);

    res.status(200).json({
      message: 'Foto berhasil dihapus',
      data: journal,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== GET JOURNALS (List) =====
export const getJournals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    // Convert query params with proper handling for undefined
    const filters: any = {};
    if (req.query.page) filters.page = parseInt(req.query.page as string, 10);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.student_id) filters.student_id = parseInt(req.query.student_id as string, 10);
    if (req.query.assignment_id) filters.assignment_id = parseInt(req.query.assignment_id as string, 10);
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const result = await journalService.getJournals(userId, userRole, filters);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== GET JOURNAL BY ID =====
export const getJournalById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Journal ID dibutuhkan' });
    }

    const journalId = parseInt(req.params.id, 10);
    const journal = await journalService.getJournalById(userId, userRole, journalId);

    res.status(200).json({
      data: journal,
    });
  } catch (error: any) {
    if (error.message.includes('tidak ditemukan')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

// ===== DELETE JOURNAL =====
export const deleteJournal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    if (!req.params.id) {
      return res.status(400).json({ message: 'Journal ID dibutuhkan' });
    }

    const journalId = parseInt(req.params.id, 10);
    await journalService.deleteJournal(userId, journalId);

    res.status(200).json({
      message: 'Journal berhasil dihapus',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== GET MY JOURNALS (Student Helper) =====
export const getMyJournals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    // Convert query params
    const filters: any = {};
    if (req.query.page) filters.page = parseInt(req.query.page as string, 10);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const result = await journalService.getMyJournals(userId, filters);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ===== GET SUPERVISED JOURNALS (Teacher Helper) =====
export const getSupervisedJournals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    // Convert query params
    const filters: any = {};
    if (req.query.page) filters.page = parseInt(req.query.page as string, 10);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string, 10);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.student_id) filters.student_id = parseInt(req.query.student_id as string, 10);
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;

    const result = await journalService.getSupervisedJournals(userId, filters);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
