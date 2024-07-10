"use server"

import { z } from 'zod'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const FormSchema = z.object({
    id: z.string({
        invalid_type_error: 'Please select a customer',
    }),
    customerId: z.string(),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0'}),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status'
    }),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}
export async function createInvoice(prevState: StaticRange, formData: FormData) {

    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing fields. Failed to Create Invoice.",
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try { 
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date) 
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
        
    } catch (error) {

    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

//============= INVOICE UPDATE =============
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, prevState: State, formData: FormData) {

    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to update Invoice.',
        }
    }

    const { customerId, amount, status } = validatedFields.data
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} 
            WHERE id = ${id}
        `;
        
    } catch (error) {

    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

//============= DELETE UPDATE =============
export async function deleteInvoice(id: string) {

    try {
        await sql`DELETE FROM invoices WHERE id = ${id} `;
        
    } catch (error) {

    }

    revalidatePath('/dashboard/invoices');

}
