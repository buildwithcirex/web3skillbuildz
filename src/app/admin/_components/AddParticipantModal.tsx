'use client'

import { useState, useActionState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { addParticipantToWhitelist } from '@/app/actions/project'

export default function AddParticipantModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(addParticipantToWhitelist, {
    error: null,
    success: false,
  })

  // Close modal on success
  useEffect(() => {
    if (state.success && !state.error) {
      setIsOpen(false)
      // Reset state can't be easily done with useActionState without reloading,
      // but closing the modal is usually sufficient for UX here.
    }
  }, [state])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-stone-900 bg-amber-400 hover:bg-amber-300 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
      >
        <Plus className="w-4 h-4" />
        Add Participant
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-stone-900 w-full max-w-md p-6 relative shadow-[8px_8px_0px_0px_#1c1917]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold font-mono uppercase text-stone-900">Add Participant</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-stone-500 hover:text-stone-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-medium text-stone-600 mb-5 font-sans">
              This will add the participant to the whitelist. They can then log in using Magic Link, which will complete their account creation.
            </p>

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. john.doe@kccemsr.edu.in"
                  className="w-full px-4 py-2.5 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-stone-900 uppercase tracking-widest mb-1.5">
                  Phone
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 focus:outline-none focus:bg-white transition"
                />
              </div>

              {state.error && (
                <div className="text-sm font-bold font-mono text-red-900 bg-red-100 border-2 border-red-900 p-3 mt-4">
                  {state.error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 border-2 border-stone-900 bg-stone-200 hover:bg-stone-300 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 border-2 border-stone-900 bg-indigo-400 hover:bg-indigo-300 disabled:opacity-50 text-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
                >
                  {isPending ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
