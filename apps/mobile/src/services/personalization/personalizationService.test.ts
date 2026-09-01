import { PersonalizationError } from '@cloud6/shared';
import { personalizationService } from './personalizationService';

function mockFetch(impl: () => Promise<Response> | Response) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('personalizationService.createUserContext', () => {
  it('returns the normalized context from the CLOUD6 backend', async () => {
    const context = {
      persona: 'runner',
      activities: ['running'],
      preferredTimeOfDay: 'morning',
      weatherPriorities: ['temperature', 'humidity'],
    };
    mockFetch(() => new Response(JSON.stringify(context), { status: 200 }));

    const result = await personalizationService.createUserContext({
      persona: 'runner',
      preferredTimeOfDay: 'morning',
    });

    expect(result).toEqual(context);
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/personalization/context');
    expect(init.method).toBe('POST');
  });

  it('normalizes a backend error response into a PersonalizationError with the backend code', async () => {
    mockFetch(
      () => new Response(JSON.stringify({ error: { code: 'PERSONA_INVALID' } }), { status: 400 }),
    );

    await expect(
      personalizationService.createUserContext({ persona: 'astronaut' as never }),
    ).rejects.toBeInstanceOf(PersonalizationError);
    await expect(
      personalizationService.createUserContext({ persona: 'astronaut' as never }),
    ).rejects.toMatchObject({ code: 'PERSONA_INVALID' });
  });

  it('normalizes a network failure', async () => {
    mockFetch(() => Promise.reject(new Error('Network request failed')));

    await expect(
      personalizationService.createUserContext({ persona: 'runner' }),
    ).rejects.toBeInstanceOf(PersonalizationError);
  });

  it('normalizes malformed JSON', async () => {
    mockFetch(() => new Response('not json{{', { status: 200 }));

    await expect(
      personalizationService.createUserContext({ persona: 'runner' }),
    ).rejects.toBeInstanceOf(PersonalizationError);
  });
});
