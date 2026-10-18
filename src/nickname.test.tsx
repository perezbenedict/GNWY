import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ContactScreen } from './screens/ContactScreen';
import { buildPayload, submitFeedback } from './api/submit';
import { NICKNAMES } from './data/nicknames';
import { normalizeUsed, pickSuggestion } from './lib/nicknames';
import type { Answers } from './types';

vi.mock('./api/submit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/submit')>();
  return { ...actual, submitFeedback: vi.fn() };
});

// Hermetic: the App-level 409 retry must not hit the network in jsdom.
vi.mock('./api/nicknames', () => ({
  fetchUsedNicknames: vi.fn(async () => new Set<string>()),
}));

const mockSubmit = vi.mocked(submitFeedback);
const POOL: readonly string[] = NICKNAMES;

beforeEach(() => {
  vi.clearAllMocks();
  mockSubmit.mockResolvedValue(undefined);
});

describe('pickSuggestion', () => {
  it('never returns last when alternatives exist', () => {
    const pool = ['a', 'b', 'c'];
    for (let i = 0; i < 300; i++) {
      const pick = pickSuggestion(pool, 'a', new Set());
      expect(pick).not.toBeNull();
      expect(pick).not.toBe('a');
    }
  });

  it('excludes used names and returns null when everything is used', () => {
    const pool = ['a', 'b'];
    for (let i = 0; i < 50; i++) {
      expect(pickSuggestion(pool, null, new Set(['a']))).toBe('b');
    }
    expect(pickSuggestion(pool, null, new Set(pool))).toBeNull();
  });

  it('falls back to unused names ignoring last when all non-last are used', () => {
    const pool = ['a', 'b'];
    for (let i = 0; i < 50; i++) {
      expect(pickSuggestion(pool, 'a', new Set(['b']))).toBe('a');
    }
  });
});

describe('normalizeUsed', () => {
  it('parses the used list defensively', () => {
    expect(normalizeUsed({ used: ['x', 'y', ' x '] })).toEqual(new Set(['x', 'y']));
    expect(normalizeUsed({ used: [1, null, 'ok'] })).toEqual(new Set(['ok']));
    expect(normalizeUsed({ used: 'garbage' }).size).toBe(0);
    expect(normalizeUsed(null).size).toBe(0);
    expect(normalizeUsed(undefined).size).toBe(0);
  });
});

function nameInput() {
  return screen.getByPlaceholderText((value) => POOL.includes(value));
}

function NameHarness() {
  const [name, setName] = useState('');
  const [generated, setGenerated] = useState(false);
  const [chosen, setChosen] = useState('');
  return (
    <>
      <ContactScreen
        name={name}
        contact=""
        onNameChange={setName}
        onContactChange={() => {}}
        onNameGenerated={(value) => {
          setGenerated(true);
          setChosen(value);
          setName(value);
        }}
        onNameEdited={() => setGenerated(false)}
        onBack={() => {}}
        onNext={() => {}}
      />
      <div data-testid="generated-flag">{generated ? 'yes' : 'no'}</div>
      <div data-testid="chosen-name">{chosen}</div>
    </>
  );
}

describe('ContactScreen nickname generator', () => {
  it('shows a suggestion as the placeholder and cycles with "Give me another"', async () => {
    const user = userEvent.setup();
    render(<NameHarness />);
    const input = nameInput();
    const first = input.getAttribute('placeholder');
    expect(first).toBeTruthy();
    expect(POOL).toContain(first);

    await user.click(screen.getByRole('button', { name: /Give me another/ }));
    const second = input.getAttribute('placeholder');
    expect(second).toBeTruthy();
    expect(POOL).toContain(second);
    expect(second).not.toBe(first);
    // the field value is never touched by the generator
    expect(input).toHaveValue('');
  });

  it('fills the field on "Use this nickname", flags it generated, and a manual edit clears the flag', async () => {
    const user = userEvent.setup();
    render(<NameHarness />);
    const input = nameInput();
    const suggestion = input.getAttribute('placeholder');
    expect(screen.getByTestId('generated-flag')).toHaveTextContent('no');

    await user.click(screen.getByRole('button', { name: 'Use this nickname' }));
    expect(input).toHaveValue(suggestion);
    expect(screen.getByTestId('chosen-name')).toHaveTextContent(suggestion ?? '');
    expect(screen.getByTestId('generated-flag')).toHaveTextContent('yes');

    await user.type(input, '!');
    expect(screen.getByTestId('generated-flag')).toHaveTextContent('no');
    expect(screen.getByRole('button', { name: 'Use this nickname' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('never flags manually typed names and disables Use while the value differs', async () => {
    const user = userEvent.setup();
    render(<NameHarness />);
    const useButton = screen.getByRole('button', { name: 'Use this nickname' });
    expect(useButton).toHaveAttribute('aria-disabled', 'false');

    await user.type(nameInput(), 'Brother Tunde');
    expect(screen.getByTestId('generated-flag')).toHaveTextContent('no');
    expect(screen.getByTestId('chosen-name')).toHaveTextContent('');
    expect(useButton).toHaveAttribute('aria-disabled', 'true');

    // clearing the field re-enables Use
    await user.clear(nameInput());
    expect(useButton).toHaveAttribute('aria-disabled', 'false');
  });
});

describe('buildPayload nameIsGenerated', () => {
  const base: Answers = {
    rating: 5,
    stoodOut: [],
    stoodOutText: '',
    improve: [],
    improveText: '',
    next: [],
    nextText: '',
    ideaCustom: '',
    name: 'Ada',
    contact: '',
  };

  it('omits the key when false/undefined and includes it when true', () => {
    expect(buildPayload(base)).not.toHaveProperty('nameIsGenerated');
    expect(buildPayload({ ...base, nameIsGenerated: false })).not.toHaveProperty('nameIsGenerated');
    const payload = buildPayload({ ...base, nameIsGenerated: true });
    expect(payload.nameIsGenerated).toBe(true);
    expect(payload.name).toBe('Ada');
  });
});

describe('App 409 nickname retry', () => {
  it('re-picks a fresh generated name and resends once on 409', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /Let.s talk/ }));
    await screen.findByRole('heading', { name: /First things first/ });
    await user.click(screen.getByRole('radio', { name: /Really good/ }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: /hit different today/ });
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await screen.findByRole('heading', { name: /Be honest/ });
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await screen.findByRole('heading', { name: /do more of/ });
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await screen.findByRole('heading', { name: /One last thing/ });

    const input = nameInput();
    const firstChoice = input.getAttribute('placeholder');
    expect(firstChoice).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Use this nickname' }));
    expect(input).toHaveValue(firstChoice);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: /Your take/ });

    mockSubmit.mockRejectedValueOnce({ status: 409 });
    await user.click(screen.getByRole('button', { name: /Send my feedback/ }));

    await screen.findByRole('heading', { name: /heard\. Always/ });
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(2));
    const first = mockSubmit.mock.calls[0][0];
    const second = mockSubmit.mock.calls[1][0];
    expect(first.nameIsGenerated).toBe(true);
    expect(second.name).not.toBe('');
    expect(second.name).not.toBe(first.name);
    expect(second.name).not.toBe(firstChoice);
    expect(POOL).toContain(second.name);
    expect(second.nameIsGenerated).toBe(true);
  });
});
