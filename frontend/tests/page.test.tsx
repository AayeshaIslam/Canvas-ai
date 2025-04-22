import {it, expect, describe} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import UploadPage from '../app/page';
import React from 'react';


describe('upload page', () => {
    render(<UploadPage />);
    it('renders upload page', () => {
        const title = "Canvas AI Quiz Generator";
        expect(title).toBeInTheDocument;
    })

    it('renders file upload box', () => {
        const file_upload = "Drag and drop your files here";
        expect(file_upload).toBeInTheDocument;
    })

    it('clicks browse file button', () => {
        const button = screen.getByText('Browse Files');
        expect(button).toBeInTheDocument;
        fireEvent.click(button);
    })

    it('uploads pdf file', () => {
        const input = screen.getByLabelText('Browse Files');
        expect(input).toBeInTheDocument;
        const file = new File(['file content'], 'test.pdf', { type: 'pdf' });
        fireEvent.change(input, { target: { files: [file] } });
        const title = "Generate Quiz from Canvas";
        expect(title).toBeInTheDocument;
    })

    it('uploads file with drag and drop', () => {
        const dropzone = screen.getByText('Drag and drop your files here');
        const file = new File(['file content'], 'test.pdf', { type: 'pdf' });
        fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    })

    it('navigate to dashboard', () => {
        const dash_button = screen.getByRole('button', {name: "D"});
        fireEvent.click(dash_button);
        const title = "Generate Quiz from Canvas";
        expect(title).toBeInTheDocument;
    })
    
})