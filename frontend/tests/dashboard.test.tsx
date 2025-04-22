import {it, expect, describe} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import Dashboard from '../app/dashboard/page';
import React from 'react';


describe('upload page', () => {
    render(<Dashboard />);
    it('renders dashboard', () => {
        const title = "Generate Quiz from Canvas";
        expect(title).toBeInTheDocument;
    })

    it('selects course', () => {
        const selectMaterials = screen.getByRole('combobox');
        fireEvent.select(selectMaterials, 'eng2000');
        const course = "ENG2000";
        expect(course).toBeInTheDocument;
    })

    it('adds new course', async () => {
        const option = screen.getByRole('option', { name: '+ Add New Course' });
        const selectMaterials = screen.getByRole('combobox');
        await userEvent.selectOptions(selectMaterials, option);

        const courseCode = screen.getByPlaceholderText('e.g., CS101');
        fireEvent.change(courseCode, { target: { value: 'CS101' } });
        const courseName = screen.getByPlaceholderText('e.g., Introduction to Computer Science');
        fireEvent.change(courseName, { target: { value: 'Computer Science' } });

        const addButton = screen.getByRole('button', {name: "Add Course"});
        fireEvent.click(addButton);
        const course = "CS101: Computer Science";
        expect(course).toBeInTheDocument;
    })

    it('cancels adding new course', async () => {
        const option = screen.getByRole('option', { name: '+ Add New Course' });
        const selectMaterials = screen.getByRole('combobox');
        await userEvent.selectOptions(selectMaterials, option);

        const cancelButton = screen.getByRole('button', {name: "Cancel"});
        fireEvent.click(cancelButton);
        const course = "CS101: Computer Science";
        expect(course).toBeInTheDocument;
    })

    it('changes question number', () => {
        const questionNum = screen.getByRole('slider');
        fireEvent.change(questionNum, { target: { value: 12 } });
        const number = "12";
        expect(number).toBeInTheDocument;
        fireEvent.change(questionNum, { target: { value: 7 } });
        const number2 = "7";
        expect(number2).toBeInTheDocument;
    })

    it('changes question number', () => {
        const minusQuestion = screen.getAllByTestId('minusQuestion');
        fireEvent.click(minusQuestion[0]);
        const number = "6";
        expect(number).toBeInTheDocument;
        const addQuestion = screen.getAllByTestId('plusQuestion');
        fireEvent.click(addQuestion[0]);
        const number2 = "7";
        expect(number2).toBeInTheDocument;
    })

    it('navigate to file upload', () => {
        const uploadButton = screen.getByTestId('plus');
        fireEvent.click(uploadButton);
        const title = "Canvas AI Quiz Generator";
        expect(title).toBeInTheDocument;
    })
    
})