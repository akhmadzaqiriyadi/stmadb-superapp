// src/modules/pkl/attendance/attendance.controller.ts

import type { Request, Response } from 'express';
import { attendanceService } from './attendance.service.js';
import { getAttendancePhotoUrl } from '../../../core/config/multer.config.js';

// Tap In
export const tapIn = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    // Get latitude and longitude from form data
    const data: any = {
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
    };

    // Add photo URL only if file was uploaded
    if (req.file) {
      data.photo = getAttendancePhotoUrl(req.file.filename);
    }

    const result = await attendanceService.tapIn(studentUserId, data);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Tap Out
export const tapOut = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const result = await attendanceService.tapOut(studentUserId, req.body);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Create Manual Attendance Request
export const createManualRequest = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const result = await attendanceService.createManualRequest(studentUserId, req.body);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Attendance History
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const result = await attendanceService.getAttendanceHistory(studentUserId, req.query);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Attendance Today
export const getAttendanceToday = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const attendance = await attendanceService.getAttendanceToday(studentUserId);

    res.status(200).json({ data: attendance });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Attendance Stats
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const stats = await attendanceService.getAttendanceStats(studentUserId);

    res.status(200).json({ data: stats });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get Pending Approvals (Supervisor/Admin)
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const userRoles = req.user?.roles || [];
    const result = await attendanceService.getPendingApprovals(userId, req.query, userRoles);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Approve Manual Request
export const approveManualRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const attendanceIdParam = req.params.attendanceId;
    if (!attendanceIdParam) {
      return res.status(400).json({ message: 'ID attendance dibutuhkan' });
    }

    const attendanceId = parseInt(attendanceIdParam, 10);
    if (isNaN(attendanceId)) {
      return res.status(400).json({ message: 'ID attendance tidak valid' });
    }

    const { approval_notes } = req.body;
    const userRoles = req.user?.roles || [];

    const result = await attendanceService.approveManualRequest(
      attendanceId,
      userId,
      approval_notes,
      userRoles
    );

    res.status(200).json({
      message: 'Manual request berhasil disetujui',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Reject Manual Request
export const rejectManualRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User tidak terautentikasi' });
    }

    const attendanceIdParam = req.params.attendanceId;
    if (!attendanceIdParam) {
      return res.status(400).json({ message: 'ID attendance dibutuhkan' });
    }

    const attendanceId = parseInt(attendanceIdParam, 10);
    if (isNaN(attendanceId)) {
      return res.status(400).json({ message: 'ID attendance tidak valid' });
    }

    const { approval_notes } = req.body;
    const userRoles = req.user?.roles || [];

    const result = await attendanceService.rejectManualRequest(
      attendanceId,
      userId,
      approval_notes,
      userRoles
    );

    res.status(200).json({
      message: 'Manual request ditolak',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
