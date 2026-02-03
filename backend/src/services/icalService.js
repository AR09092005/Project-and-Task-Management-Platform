const ical = require('ical-generator').default;

class ICalService {
  // Generate iCal file for a project's tasks
  generateProjectCalendar(project, tasks) {
    try {
      const calendar = ical({
        name: project.name,
        description: project.description || `Tasks for ${project.name}`,
        timezone: 'UTC',
        prodId: '//Task Management Platform//EN',
      });

      tasks.forEach((task) => {
        if (!task.dueDate) return; // Skip tasks without due dates

        try {
          const event = {
            id: task._id.toString(),
            summary: task.title,
            description: task.description || '',
            start: new Date(task.dueDate),
            end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000), // 1 hour duration
            url: `${process.env.CLIENT_URL}/projects/${project._id}/tasks/${task._id}`,
            status: task.status === 'Done' ? 'CONFIRMED' : 'TENTATIVE',
            priority: this.getPriorityLevel(task.priority),
          };

          // Add assignees as attendees
          if (task.assignees && task.assignees.length > 0) {
            event.attendees = task.assignees.map((assignee) => ({
              name: assignee.name,
              email: assignee.email,
            }));
          }

          // Add alarms for upcoming tasks
          if (task.status !== 'Done') {
            event.alarms = [
              {
                type: 'display',
                trigger: 30 * 60, // 30 minutes before
                description: `Reminder: ${task.title}`,
              },
            ];
          }

          calendar.createEvent(event);
        } catch (eventError) {
          console.error(`[iCalService] Error creating event for task ${task._id}:`, eventError.message);
          // Continue with other tasks
        }
      });

      return calendar.toString();
    } catch (error) {
      console.error('[iCalService] Error generating project calendar:', error);
      throw new Error(`Failed to generate calendar: ${error.message}`);
    }
  }

  // Generate iCal file for a single task
  generateTaskCalendar(task, project) {
    const calendar = ical({
      name: `Task: ${task.title}`,
      timezone: 'UTC',
      prodId: '//Task Management Platform//EN',
    });

    if (task.dueDate) {
      calendar.createEvent({
        id: task._id.toString(),
        summary: task.title,
        description: task.description || '',
        start: new Date(task.dueDate),
        end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000),
        url: `${process.env.CLIENT_URL}/projects/${project._id}/tasks/${task._id}`,
        status: task.status === 'Done' ? 'CONFIRMED' : 'TENTATIVE',
        priority: this.getPriorityLevel(task.priority),
        alarms: task.status !== 'Done' ? [
          {
            type: 'display',
            trigger: 30 * 60,
            description: `Reminder: ${task.title}`,
          },
        ] : [],
      });
    }

    return calendar.toString();
  }

  // Generate iCal file for all user tasks
  generateUserCalendar(user, tasks) {
    try {
      const calendar = ical({
        name: `${user.name}'s Tasks`,
        description: `All tasks assigned to ${user.name}`,
        timezone: 'UTC',
        prodId: '//Task Management Platform//EN',
      });

      tasks.forEach((task) => {
        if (!task.dueDate) return;

        try {
          calendar.createEvent({
            id: task._id.toString(),
            summary: task.title,
            description: task.description || '',
            start: new Date(task.dueDate),
            end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000),
            url: task.project ? `${process.env.CLIENT_URL}/projects/${task.project._id}/tasks/${task._id}` : undefined,
            status: task.status === 'Done' ? 'CONFIRMED' : 'TENTATIVE',
            priority: this.getPriorityLevel(task.priority),
            alarms: task.status !== 'Done' ? [
              {
                type: 'display',
                trigger: 30 * 60,
                description: `Reminder: ${task.title}`,
              },
            ] : [],
          });
        } catch (eventError) {
          console.error(`[iCalService] Error creating event for task ${task._id}:`, eventError.message);
          // Continue with other tasks
        }
      });

      return calendar.toString();
    } catch (error) {
      console.error('[iCalService] Error generating user calendar:', error);
      throw new Error(`Failed to generate calendar: ${error.message}`);
    }
  }

  // Convert priority to iCal priority level (1-9, where 1 is highest)
  getPriorityLevel(priority) {
    const priorityMap = {
      'Urgent': 1,
      'High': 3,
      'Medium': 5,
      'Low': 7,
    };
    return priorityMap[priority] || 5;
  }
}

module.exports = new ICalService();
