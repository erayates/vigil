import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DebriefForm } from './debrief-form';

describe('DebriefForm', () => {
  afterEach(() => cleanup());

  it('records the field values on submit', () => {
    const onRecord = vi.fn();
    render(<DebriefForm onRecord={onRecord} onSkip={() => {}} />);

    fireEvent.change(screen.getByLabelText('Result'), { target: { value: 'Done' } });
    fireEvent.change(screen.getByLabelText('Blocker'), { target: { value: 'None' } });
    fireEvent.change(screen.getByLabelText('Next action'), { target: { value: 'Ship' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));

    expect(onRecord).toHaveBeenCalledWith({ result: 'Done', blocker: 'None', nextAction: 'Ship' });
  });

  it('skips without recording', () => {
    const onRecord = vi.fn();
    const onSkip = vi.fn();
    render(<DebriefForm onRecord={onRecord} onSkip={onSkip} />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onRecord).not.toHaveBeenCalled();
  });
});
