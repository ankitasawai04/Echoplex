// server/routes/attendee.routes.ts
import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory storage (replace with database in production)
interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  ticketId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  location?: string;
  eventId: string;
}

const attendees = new Map<string, Attendee>();

// POST: Check-in attendee
router.post('/check-in', async (req: Request, res: Response) => {
  try {
    const { ticketId, eventId, location } = req.body;

    if (!ticketId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and Event ID are required'
      });
    }

    // Find attendee by ticket ID
    let attendee = Array.from(attendees.values()).find(
      a => a.ticketId === ticketId && a.eventId === eventId
    );

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found. Please register first.'
      });
    }

    if (attendee.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Attendee already checked in',
        data: {
          attendee,
          checkInTime: attendee.checkInTime
        }
      });
    }

    // Update check-in status
    attendee.checkInTime = new Date().toISOString();
    attendee.status = 'checked_in';
    attendee.location = location;
    attendees.set(attendee.id, attendee);

    return res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: {
        attendee,
        checkInTime: attendee.checkInTime
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during check-in'
    });
  }
});

// POST: Check-out attendee
router.post('/check-out', async (req: Request, res: Response) => {
  try {
    const { ticketId, eventId } = req.body;

    if (!ticketId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and Event ID are required'
      });
    }

    // Find attendee by ticket ID
    let attendee = Array.from(attendees.values()).find(
      a => a.ticketId === ticketId && a.eventId === eventId
    );

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found'
      });
    }

    if (attendee.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Attendee must be checked in before checking out'
      });
    }

    // Update check-out status
    attendee.checkOutTime = new Date().toISOString();
    attendee.status = 'checked_out';
    attendees.set(attendee.id, attendee);

    // Calculate duration
    const duration = new Date(attendee.checkOutTime).getTime() - 
                    new Date(attendee.checkInTime!).getTime();
    const durationMinutes = Math.floor(duration / 60000);

    return res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: {
        attendee,
        checkOutTime: attendee.checkOutTime,
        durationMinutes
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during check-out'
    });
  }
});

// GET: Get attendee status
router.get('/status/:ticketId/:eventId', async (req: Request, res: Response) => {
  try {
    const { ticketId, eventId } = req.params;

    const attendee = Array.from(attendees.values()).find(
      a => a.ticketId === ticketId && a.eventId === eventId
    );

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: attendee
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET: Get all checked-in attendees for an event
router.get('/checked-in/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const checkedInAttendees = Array.from(attendees.values()).filter(
      a => a.eventId === eventId && a.status === 'checked_in'
    );

    return res.status(200).json({
      success: true,
      count: checkedInAttendees.length,
      data: checkedInAttendees
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST: Register new attendee (for testing)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, ticketId, eventId } = req.body;

    if (!name || !email || !ticketId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, ticket ID, and event ID are required'
      });
    }

    const id = `ATD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newAttendee: Attendee = {
      id,
      name,
      email,
      phone,
      ticketId,
      eventId,
      checkInTime: null,
      checkOutTime: null,
      status: 'not_checked_in'
    };

    attendees.set(id, newAttendee);

    return res.status(201).json({
      success: true,
      message: 'Attendee registered successfully',
      data: newAttendee
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// GET: Get zone statistics
router.get('/zones/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Get all checked-in attendees for this event
    const allAttendees = Array.from(attendees.values())
      .filter(a => a.eventId === eventId && a.status === 'checked_in');
    
    // Group attendees by zone/location
    const zoneStats = allAttendees.reduce((acc, attendee) => {
      const zone = attendee.location || 'Unknown';
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return res.status(200).json({
      success: true,
      data: {
        totalCheckedIn: allAttendees.length,
        zones: zoneStats
      }
    });
  } catch (error) {
    console.error('Zone stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// POST: Zone-specific check-in with QR code
router.post('/check-in/qr', async (req: Request, res: Response) => {
  try {
    const { ticketId, eventId, zoneId, zoneName } = req.body;

    // Validate required fields
    if (!ticketId || !eventId || !zoneId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID, Event ID, and Zone ID are required'
      });
    }

    // Find the attendee by ticket ID
    let attendee = Array.from(attendees.values()).find(
      a => a.ticketId === ticketId && a.eventId === eventId
    );

    // If attendee not found, return error
    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found. Please register first.'
      });
    }

    // Check if already checked in
    if (attendee.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Already checked in',
        data: { attendee }
      });
    }

    // Record check-in with zone information
    attendee.checkInTime = new Date().toISOString();
    attendee.status = 'checked_in';
    attendee.location = zoneName || zoneId;
    attendees.set(attendee.id, attendee);

    return res.status(200).json({
      success: true,
      message: `Checked in to ${zoneName || zoneId}`,
      data: { attendee }
    });
  } catch (error) {
    console.error('QR Check-in error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// POST: Bulk import attendees from CSV
router.post('/bulk-import', async (req: Request, res: Response) => {
  try {
    const { attendeeList, eventId } = req.body;

    // Validate input
    if (!Array.isArray(attendeeList) || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Attendee list array and event ID are required'
      });
    }

    const imported = [];
    const failed = [];

    // Process each attendee
    for (const attendee of attendeeList) {
      try {
        const { name, email, phone, ticketId } = attendee;

        // Validate required fields
        if (!name || !email || !ticketId) {
          failed.push({ 
            attendee, 
            reason: 'Missing required fields (name, email, or ticketId)' 
          });
          continue;
        }

        // Check if ticket ID already exists
        const existingAttendee = Array.from(attendees.values()).find(
          a => a.ticketId === ticketId && a.eventId === eventId
        );

        if (existingAttendee) {
          failed.push({ 
            attendee, 
            reason: `Ticket ID ${ticketId} already exists` 
          });
          continue;
        }

        // Generate unique attendee ID
        const id = `ATD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create new attendee
        const newAttendee: Attendee = {
          id,
          name: name.trim(),
          email: email.trim(),
          phone: phone ? phone.trim() : '',
          ticketId: ticketId.trim(),
          eventId,
          checkInTime: null,
          checkOutTime: null,
          status: 'not_checked_in'
        };

        attendees.set(id, newAttendee);
        imported.push(newAttendee);
      } catch (error) {
        failed.push({ attendee, reason: 'Processing error' });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${imported.length} attendees`,
      data: {
        imported: imported.length,
        failed: failed.length,
        failedRecords: failed
      }
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during bulk import'
    });
  }
});
export default router;