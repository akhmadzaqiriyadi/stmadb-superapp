import type { Request, Response } from 'express';
import { teachingJournalService } from './teaching-journal.service.js';
import type { 
  CreateTeachingJournalDto, 
  GetMyJournalsQuery, 
  GetAdminJournalsQuery,
  GetMissingJournalsQuery 
} from './teaching-journal.validation.js';
import { 
  uploadJournalPhotos, 
  getJournalPhotoUrl,
  deleteJournalPhoto
} from '../../../core/config/multer.config.js';

// ===== TEACHER ENDPOINTS =====

/**
 * Check timing validation
 */
export const checkJournalTiming = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const { scheduleId } = req.params;
    
    const validation = await teachingJournalService.validateJournalTiming(
      parseInt(scheduleId!),
      teacherId
    );
    
    res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

/**
 * Create teaching journal
 */
export const createJournal = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const files = req.files as Express.Multer.File[];
    
    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: 'User ID tidak ditemukan. Silakan login ulang.'
      });
    }
    
    // Parse form data (multipart/form-data sends everything as strings)
    const data: CreateTeachingJournalDto = {
      schedule_id: parseInt(req.body.schedule_id),
      journal_date: new Date(req.body.journal_date),
      teacher_status: req.body.teacher_status,
      teacher_notes: req.body.teacher_notes || undefined,
      material_topic: req.body.material_topic || undefined,
      material_description: req.body.material_description || undefined,
      learning_method: req.body.learning_method || undefined,
      learning_media: req.body.learning_media || undefined,
      learning_achievement: req.body.learning_achievement || undefined,
    };
    
    const journal = await teachingJournalService.createJournal(data, teacherId, files);
    
    res.status(201).json({
      success: true,
      message: 'Jurnal berhasil dibuat',
      data: journal
    });
  } catch (error) {
    const message = (error as Error).message;
    
    if (message.includes('hanya dapat diisi pada jam')) {
      return res.status(403).json({
        success: false,
        message,
        code: 'TIME_VALIDATION_FAILED'
      });
    }
    
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({
        success: false,
        message,
        code: 'SCHEDULE_NOT_FOUND'
      });
    }
    
    if (message.includes('sudah dibuat')) {
      return res.status(409).json({
        success: false,
        message,
        code: 'DUPLICATE_JOURNAL'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal membuat jurnal',
      error: message
    });
  }
};

/**
 * Upload photos to existing journal
 */
export const uploadPhotos = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const { journalId } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }
    
    // Check journal ownership
    const journal = await teachingJournalService.getJournalDetail(
      parseInt(journalId!), 
      teacherId, 
      'Guru'
    );
    
    if (!journal) {
      // Clean up uploaded files
      files.forEach(file => deleteJournalPhoto(file.filename));
      return res.status(404).json({
        success: false,
        message: 'Jurnal tidak ditemukan'
      });
    }
    
    // Save photos to database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const photoRecords = await prisma.journalPhoto.createMany({
      data: files.map(file => ({
        journal_id: parseInt(journalId!),
        photo_url: getJournalPhotoUrl(file.filename),
        filename: file.filename
      }))
    });
    
    // Get updated photos
    const photos = await prisma.journalPhoto.findMany({
      where: { journal_id: parseInt(journalId!) }
    });
    
    res.status(201).json({
      success: true,
      message: `${files.length} foto berhasil diupload`,
      data: photos
    });
  } catch (error) {
    // Clean up files on error
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach(file => deleteJournalPhoto(file.filename));
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload foto',
      error: (error as Error).message
    });
  }
};

/**
 * Delete photo from journal
 */
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const { journalId, photoId } = req.params;
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get photo
    const photo = await prisma.journalPhoto.findUnique({
      where: { id: parseInt(photoId!) },
      include: {
        journal: true
      }
    });
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto tidak ditemukan'
      });
    }
    
    // Check ownership
    if (photo.journal.teacher_user_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses'
      });
    }
    
    // Delete from filesystem
    deleteJournalPhoto(photo.filename);
    
    // Delete from database
    await prisma.journalPhoto.delete({
      where: { id: parseInt(photoId!) }
    });
    
    res.status(200).json({
      success: true,
      message: 'Foto berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus foto',
      error: (error as Error).message
    });
  }
};

/**
 * Get my journals
 */
export const getMyJournals = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const query = req.query as unknown as GetMyJournalsQuery;
    
    const result = await teachingJournalService.getMyJournals(teacherId, query);
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

/**
 * Get journal detail
 */
export const getJournalDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { journalId } = req.params;
    
    const journal = await teachingJournalService.getJournalDetail(
      parseInt(journalId!),
      userId,
      userRole
    );
    
    res.status(200).json({
      success: true,
      data: journal
    });
  } catch (error) {
    const message = (error as Error).message;
    
    if (message.includes('tidak ditemukan')) {
      return res.status(404).json({
        success: false,
        message
      });
    }
    
    if (message.includes('tidak memiliki akses')) {
      return res.status(403).json({
        success: false,
        message
      });
    }
    
    res.status(500).json({
      success: false,
      message
    });
  }
};

/**
 * Delete journal
 */
export const deleteJournal = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.userId;
    const { journalId } = req.params;
    
    const result = await teachingJournalService.deleteJournal(
      parseInt(journalId!),
      teacherId
    );
    
    res.status(200).json({
      success: true,
      message: 'Jurnal berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

// ===== ADMIN ENDPOINTS =====

/**
 * Get admin statistics
 */
export const getAdminStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await teachingJournalService.getAdminStatistics();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

/**
 * Get all journals (admin)
 */
export const getAllJournals = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as GetAdminJournalsQuery;
    
    const result = await teachingJournalService.getAllJournals(query);
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

/**
 * Get missing journals
 */
export const getMissingJournals = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as GetMissingJournalsQuery;
    
    const result = await teachingJournalService.getMissingJournals(query);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};
