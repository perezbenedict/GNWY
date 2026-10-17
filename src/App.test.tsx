import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { submitFeedback } from './api/submit';

vi.mock('./api/submit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/submit')>();
  return { ...actual, submitFeedback: vi.fn() };
});

const mockSubmit = vi.mocked(submitFeedback);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const HEADINGS = {
  intro: /YOUR VOICE/,
  rating: /First things first/,
  stoodOut: /hit different today/,
  improve: /Be honest/,
  next: /do more of/,
  contact: /One last thing/,
  review: /Your take/,
  success: /heard\. Always/,
} as const;

async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Let.s talk/ }));
  await screen.findByRole('heading', { name: HEADINGS.rating });
}

// Rating -> StoodOut -> Improve -> Next -> Contact -> Review
async function goToReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('heading', { name: HEADINGS.stoodOut });
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByRole('heading', { name: HEADINGS.improve });
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByRole('heading', { name: HEADINGS.next });
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByRole('heading', { name: HEADINGS.contact });
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('heading', { name: HEADINGS.review });
}

async function submitFromReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Send my feedback/ }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSubmit.mockResolvedValue(undefined);
});

describe('rating screen', () => {
  it('is single-select and maps labels to values (10/10 -> 5, Not my best -> 1)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    const top = screen.getByRole('radio', { name: /10\/10/ });
    expect(top).toHaveAttribute('aria-checked', 'false');

    await user.click(top);
    expect(top).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: /Really good/ }));
    expect(top).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /Really good/ })).toHaveAttribute('aria-checked', 'true');

    await user.click(top);
    await goToReview(user);
    await submitFromReview(user);
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0][0].rating).toBe(5);

    // value mapping for the lowest option
    await screen.findByRole('heading', { name: HEADINGS.success });
    await user.click(screen.getByRole('button', { name: /Send another response/ }));
    await screen.findByRole('heading', { name: HEADINGS.intro });
    await start(user);
    await user.click(screen.getByRole('radio', { name: /Not my best/ }));
    await goToReview(user);
    await submitFromReview(user);
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(2));
    expect(mockSubmit.mock.calls[1][0].rating).toBe(1);
  });

  it('supports arrow-key navigation in the radiogroup', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    const first = screen.getByRole('radio', { name: /10\/10/ });
    first.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Really good/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Really good/ })).toHaveFocus();
  });
});

describe('multi-select chips', () => {
  it('toggles chips on and off', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });

    const chip = screen.getByRole('button', { name: /worship was something else/ });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    // character counter caps the optional textarea at 280
    const textarea = screen.getByPlaceholderText(/That song, that word/);
    expect(textarea).toHaveAttribute('maxlength', '280');
  });

  it('maps screen-2 chips to canonical categories and builds lossless strings', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });

    await user.click(screen.getByRole('button', { name: /worship was something else/ }));
    await user.click(screen.getByRole('button', { name: /people and connection/ }));
    await user.type(screen.getByPlaceholderText(/That song, that word/), 'that closing song');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.improve });

    await user.click(screen.getByRole('button', { name: /The timing/ }));
    await user.type(screen.getByPlaceholderText(/made the experience better/), 'started late');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.next });

    await user.click(screen.getByRole('button', { name: /More worship sessions/ }));
    await user.click(screen.getByRole('button', { name: /my own idea/ }));
    await user.type(screen.getByPlaceholderText(/Drop your idea/), 'acoustic set');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.contact });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.review });
    await submitFromReview(user);

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0][0]).toMatchObject({
      categories: ['Worship', 'Welcome & Hospitality'],
      liked: 'The worship was something else \u{1F3B6}, The people and connection \u{1FAC2} - that closing song',
      disliked: 'The timing \u23F0 - started late',
      suggestions:
        'More worship sessions \u{1F3B6}, I have my own idea \u{1F4A1}, acoustic set',
      expectations: '',
    });
  });
});

describe('"Nothing comes to mind" exclusivity', () => {
  async function goToImprove(user: ReturnType<typeof userEvent.setup>) {
    await start(user);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.improve });
  }

  it('clears other selections when chosen, and is cleared when another is chosen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToImprove(user);

    const sound = screen.getByRole('button', { name: /sound and production/ });
    const timing = screen.getByRole('button', { name: /The timing/ });
    const nothing = screen.getByRole('button', { name: /Nothing comes to mind/ });

    await user.click(sound);
    expect(sound).toHaveAttribute('aria-pressed', 'true');

    // selecting "Nothing..." clears everything else
    await user.click(nothing);
    expect(nothing).toHaveAttribute('aria-pressed', 'true');
    expect(sound).toHaveAttribute('aria-pressed', 'false');

    // selecting another option deselects "Nothing..."
    await user.click(timing);
    expect(timing).toHaveAttribute('aria-pressed', 'true');
    expect(nothing).toHaveAttribute('aria-pressed', 'false');

    // toggling "Nothing..." off leaves nothing selected
    await user.click(nothing);
    await user.click(nothing);
    expect(nothing).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('navigation', () => {
  it('moves forward and backward between screens', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: HEADINGS.rating });

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: HEADINGS.intro });
  });

  it('preserves answers when navigating backwards', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    await user.click(screen.getByRole('radio', { name: /Really good/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });
    await user.click(screen.getByRole('button', { name: /The whole atmosphere/ }));
    await user.type(screen.getByPlaceholderText(/That song, that word/), 'the vibe');

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: HEADINGS.rating });
    expect(screen.getByRole('radio', { name: /Really good/ })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });
    expect(screen.getByRole('button', { name: /The whole atmosphere/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByPlaceholderText(/That song, that word/)).toHaveValue('the vibe');
  });
});

describe('skipping and optional fields', () => {
  it('allows skipping every optional question and submitting with only a rating', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    await user.click(screen.getByRole('radio', { name: /Really good/ }));
    await goToReview(user);
    await submitFromReview(user);

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0][0]).toMatchObject({
      rating: 4,
      liked: '',
      disliked: '',
      suggestions: '',
      name: '',
      contact: '',
    });
    await screen.findByRole('heading', { name: HEADINGS.success });
  });

  it('treats contact fields as optional', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    await user.click(screen.getByRole('radio', { name: /It was alright/ }));
    await goToReview(user);
    await submitFromReview(user);

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0][0].name).toBe('');
    expect(mockSubmit.mock.calls[0][0].contact).toBe('');
  });
});

describe('submission', () => {
  it('blocks an empty submission with an inline error', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);

    // no rating selected; chips still count as content, so first verify chip-less skip path
    await goToReview(user);
    await submitFromReview(user);

    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a rating or share at least one thought to send.');
    expect(mockSubmit).not.toHaveBeenCalled();

    // a single chip satisfies the requirement
    await user.click(screen.getByRole('button', { name: /Go back and edit/ }));
    await screen.findByRole('heading', { name: HEADINGS.contact });
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: HEADINGS.next });
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: HEADINGS.improve });
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });
    await user.click(screen.getByRole('button', { name: /Something else entirely/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.improve });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.next });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.contact });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.review });
    await submitFromReview(user);

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions while a request is in flight', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('radio', { name: /Really good/ }));

    const pending = deferred<void>();
    mockSubmit.mockReturnValueOnce(pending.promise);
    await goToReview(user);

    const send = screen.getByRole('button', { name: /Send my feedback/ });
    await user.click(send);
    expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled();

    // second click while in flight is ignored (disabled button + in-code guard)
    await user.click(screen.getByRole('button', { name: /Sending/ }));
    fireEvent.click(screen.getByRole('button', { name: /Sending/ }));
    expect(mockSubmit).toHaveBeenCalledTimes(1);

    pending.resolve();
    await screen.findByRole('heading', { name: HEADINGS.success });
  });

  it('shows the success screen only after a resolved request', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('radio', { name: /Really good/ }));

    const pending = deferred<void>();
    mockSubmit.mockReturnValueOnce(pending.promise);
    await goToReview(user);
    await submitFromReview(user);

    expect(screen.queryByRole('heading', { name: HEADINGS.success })).not.toBeInTheDocument();

    pending.resolve();
    await screen.findByRole('heading', { name: HEADINGS.success });
  });

  it('shows a friendly error and re-enables the button on failure, then retries', async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('radio', { name: /Really good/ }));
    await goToReview(user);

    mockSubmit.mockRejectedValueOnce(new Error('network down'));
    await submitFromReview(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong. Check your connection and try again.');
    expect(screen.queryByRole('heading', { name: HEADINGS.success })).not.toBeInTheDocument();

    const retry = screen.getByRole('button', { name: 'Try again' });
    await user.click(retry);
    await screen.findByRole('heading', { name: HEADINGS.success });
    expect(mockSubmit).toHaveBeenCalledTimes(2);
  });
});

describe('success screen', () => {
  it("'Send another response' resets all answers and the stored draft", async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('radio', { name: /Really good/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: HEADINGS.stoodOut });
    await user.type(screen.getByPlaceholderText(/That song, that word/), 'kept');
    expect(localStorage.getItem('gnwy-feedback-draft')).not.toBeNull();
    await goToReviewFromStoodOut(user);
    await submitFromReview(user);
    await screen.findByRole('heading', { name: HEADINGS.success });

    await user.click(screen.getByRole('button', { name: /Send another response/ }));
    await screen.findByRole('heading', { name: HEADINGS.intro });
    expect(localStorage.getItem('gnwy-feedback-draft')).toBeNull();

    await start(user);
    expect(screen.getByRole('radio', { name: /Really good/ })).toHaveAttribute('aria-checked', 'false');
  });

  it("'Done' returns to the intro", async () => {
    const user = userEvent.setup();
    render(<App />);
    await start(user);
    await user.click(screen.getByRole('radio', { name: /It was alright/ }));
    await goToReview(user);
    await submitFromReview(user);
    await screen.findByRole('heading', { name: HEADINGS.success });

    await user.click(screen.getByRole('button', { name: /Done/ }));
    await screen.findByRole('heading', { name: HEADINGS.intro });
  });
});

// from the StoodOut screen onward: Improve -> Next -> Contact -> Review
async function goToReviewFromStoodOut(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('heading', { name: HEADINGS.improve });
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByRole('heading', { name: HEADINGS.next });
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  await screen.findByRole('heading', { name: HEADINGS.contact });
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('heading', { name: HEADINGS.review });
}
