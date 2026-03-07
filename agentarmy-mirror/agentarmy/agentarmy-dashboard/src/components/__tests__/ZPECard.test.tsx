import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZPECard } from '../ZPECard';

test('renders ZPECard and responds to controls', () => {
  const setZpe = jest.fn();
  const setUseWebGL = jest.fn();
  const setExpanded = jest.fn();
  render(<ZPECard zpe={1} setZpe={setZpe} useWebGL={false} setUseWebGL={setUseWebGL} theme="quantum" expanded={null} setExpanded={setExpanded} />);
  const range = screen.getByTestId('zpe-range') as HTMLInputElement;
  expect(range).toBeInTheDocument();
  fireEvent.change(range, { target: { value: '1.5' } });
  expect(setZpe).toHaveBeenCalled();
  const checkbox = screen.getByTestId('webgl-checkbox') as HTMLInputElement;
  fireEvent.click(checkbox);
  expect(setUseWebGL).toHaveBeenCalled();
});
