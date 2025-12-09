// src/modules/pkl/leave-request/leave-request.controller.ts

import type { Request, Response } from 'express';
import { leaveRequestService } from './leave-request.service.js';
import { getLeaveEvidenceUrl } from '../../../core/config/multer.config.js';

/**
 * Create leave request (Student)
 * POST /pkl/leave-requests
 */
export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const { date, leave_type, reason } = req.body;

    // Handle uploaded evidence files
    const files = req.files as Express.Multer.File[];
    const evidence_urls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const url = getLeaveEvidenceUrl(file.filename);
        evidence_urls.push(url);
      }
    }

    const result = await leaveRequestService.createLeaveRequest(studentUserId, {
      date,
      leave_type,
      reason,
      evidence_urls,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal membuat leave request',
    });
  }
};

/**
 * Get my leave requests (Student)
 * GET /pkl/leave-requests/my-requests
 */
export const getMyLeaveRequests = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user!.id;
    const query = req.query;

    const result = await leaveRequestService.getMyLeaveRequests(studentUserId, query);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal mengambil leave requests',
    });
  }
};

/**
 * Get pending leave requests (Supervisor/Admin)
 * GET /pkl/leave-requests/pending
 */
export const getPendingLeaveRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id || req.user!.id;
    const userRoles = Array.isArray(req.user!.roles) 
      ? req.user!.roles.filter((r: any) => typeof r === 'string')
      : req.user!.roles?.map((r: any) => r.role_name) || [];
    const query = req.query;

    const result = await leaveRequestService.getPendingLeaveRequests(userId, query, userRoles);

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal mengambil pending requests',
    });
  }
};

/**
 * Approve leave request (Supervisor/Admin)
 * PATCH /pkl/leave-requests/:id/approve
 */
export const approveLeaveRequest = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'ID request tidak valid',
      });
    }
    
    const requestId = parseInt(req.params.id);
    const userId = req.user!.user_id || req.user!.id; // Try both possible fields
    const userRoles = Array.isArray(req.user!.roles) 
      ? req.user!.roles.filter((r: any) => typeof r === 'string') // Already strings
      : req.user!.roles?.map((r: any) => r.role_name) || []; // Or extract from objects
    const { notes } = req.body;

    console.log('Controller Debug:', {
      requestId,
      userId,
      userRoles,
      rawUser: req.user,
    });

    const result = await leaveRequestService.approveLeaveRequest(requestId, userId, notes || undefined, userRoles);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal approve request',
    });
  }
};

/**
 * Reject leave request (Supervisor/Admin)
 * PATCH /pkl/leave-requests/:id/reject
 */
export const rejectLeaveRequest = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'ID request tidak valid',
      });
    }
    
    const requestId = parseInt(req.params.id);
    const userId = req.user!.user_id || req.user!.id;
    const userRoles = Array.isArray(req.user!.roles) 
      ? req.user!.roles.filter((r: any) => typeof r === 'string')
      : req.user!.roles?.map((r: any) => r.role_name) || [];
    const { notes } = req.body;

    const result = await leaveRequestService.rejectLeaveRequest(requestId, userId, notes || undefined, userRoles);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal reject request',
    });
  }
};
