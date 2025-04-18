import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';

const router = Router();
const workflowController = new WorkflowController();

// const workflowBaseUrl = 'https://workflow.appedo.com:4040/workflow/';

// POST login to workflow
router.post('/auth/login', (req, res) => workflowController.workflowLogin(req, res));

// POST fetch timesheet from workflow
router.post('/getWorkflowReports', (req, res) => workflowController.getWorkflowReports(req, res));


export default router; 