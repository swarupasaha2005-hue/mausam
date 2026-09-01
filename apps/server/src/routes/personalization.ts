import { Router } from 'express';
import { PersonalizationError, type UserContextInput } from '@cloud6/shared';
import { personalizationService } from '../modules/personalization/personalization.service';

export const personalizationRouter = Router();

const ERROR_STATUS: Record<PersonalizationError['code'], number> = {
  PERSONA_INVALID: 400,
  TIME_INVALID: 400,
  ACTIVITY_INVALID: 400,
};

personalizationRouter.post('/context', (req, res) => {
  const body = req.body as Partial<UserContextInput> | undefined;

  if (!body || typeof body.persona !== 'string') {
    const error = new PersonalizationError('PERSONA_INVALID', 'persona is required');
    return res
      .status(ERROR_STATUS[error.code])
      .json({ error: { code: error.code, message: error.message } });
  }

  try {
    const context = personalizationService.createUserContext({
      persona: body.persona as UserContextInput['persona'],
      preferredTimeOfDay: body.preferredTimeOfDay,
      activities: body.activities,
    });
    res.json(context);
  } catch (cause) {
    if (cause instanceof PersonalizationError) {
      return res
        .status(ERROR_STATUS[cause.code])
        .json({ error: { code: cause.code, message: cause.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
  }
});
