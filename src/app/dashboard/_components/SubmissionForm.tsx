'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitProject } from '@/app/actions/project'
import { createClient } from '@/lib/supabase/client'
import { Upload, Link as LinkIcon, FileText, ImageIcon, Lock, ArrowLeft } from 'lucide-react'

const initialState = { error: null, success: false }

interface SubmissionFormProps {
  initialDescription?: string
  initialDeployLink?: string
  initialScreenshotUrl?: string
  isLocked?: boolean
  isEditing?: boolean
  onCancelEdit?: () => void
}

export default function SubmissionForm({
  initialDescription = '',
  initialDeployLink = '',
  initialScreenshotUrl = '',
  isLocked = false,
  isEditing = false,
  onCancelEdit,
}: SubmissionFormProps) {
  const [state, action, pending] = useActionState(submitProject, initialState)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState(initialScreenshotUrl)
  const [previewUrl, setPreviewUrl] = useState(initialScreenshotUrl)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // BUG-20: Revoke blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // BUG-22: Use inline error UI instead of alert()
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }

    // BUG-23: Enforce 10MB file size limit
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10MB')
      return
    }

    setUploadError(null)
    setUploading(true)
    const supabase = createClient()

    // BUG-19: Delete the previously uploaded file before uploading a new one
    if (uploadedUrl) {
      const oldPath = uploadedUrl.split('/project_screenshots/')[1]
      if (oldPath) {
        await supabase.storage.from('project_screenshots').remove([oldPath])
      }
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { data, error } = await supabase.storage
      .from('project_screenshots')
      .upload(fileName, file)

    if (error) {
      alert('Upload failed: ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('project_screenshots')
      .getPublicUrl(data.path)

    setUploadedUrl(urlData.publicUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadError(null)
    setUploading(false)
  }

  if (isLocked) {
    return (
      <div className="bg-amber-100 rounded-none border-2 border-stone-900 p-8 text-center space-y-4 relative">
        <div className="absolute top-0 left-0 w-2 h-2 bg-stone-900" /><div className="absolute top-0 right-0 w-2 h-2 bg-stone-900" /><div className="absolute bottom-0 left-0 w-2 h-2 bg-stone-900" /><div className="absolute bottom-0 right-0 w-2 h-2 bg-stone-900" /><div className="w-16 h-16 bg-white border-2 border-stone-900 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1c1917]">
          <Lock className="w-8 h-8 text-stone-900" />
        </div>
        <h3 className="text-xl font-bold font-mono uppercase text-stone-900 tracking-tight">Submissions are Locked</h3>
        <p className="text-sm font-medium text-stone-700 max-w-md mx-auto">
          The event organizers have locked project submissions. New submissions and modifications are currently closed.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-none border-2 border-stone-900 p-8 space-y-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold font-mono uppercase text-stone-900">
            {isEditing ? 'Edit Your Project Submission' : 'Submit Your Project'}
          </h3>
          <p className="text-sm font-mono font-bold text-stone-500 mt-1 uppercase">
            {isEditing
              ? 'Update your project description, deploy link, or screenshot.'
              : 'Upload your screenshot, add a description and deploy link.'}
          </p>
        </div>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-stone-900 text-stone-900 bg-stone-200 hover:bg-stone-300 text-xs font-bold font-mono uppercase transition shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>

      <form action={action} className="space-y-5">
        {/* Hidden input for screenshot URL */}
        <input type="hidden" name="screenshot_url" value={uploadedUrl} />

        {/* Screenshot Upload */}
        <div>
          <label className="block text-sm font-bold font-mono text-stone-900 uppercase tracking-widest mb-2">
            <ImageIcon className="inline w-4 h-4 mr-1.5 text-stone-900" />
            Project Screenshot
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed border-stone-900 cursor-pointer transition ${
              previewUrl
                ? 'border-stone-900 bg-amber-50'
                : 'border-stone-400 hover:border-stone-900 hover:bg-stone-50'
            }`}
          >
            {previewUrl ? (
              <div className="p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-56 object-cover border-2 border-stone-900"
                />
                <p className="text-xs font-bold font-mono uppercase text-stone-600 text-center mt-3">✓ Uploaded — click to change screenshot</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                {uploading ? (
                  <div className="animate-spin w-8 h-8 border-4 border-stone-900 border-t-amber-400 rounded-full" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-stone-900 mb-3" />
                    <p className="text-sm font-bold font-mono uppercase text-stone-900">Click to upload screenshot</p>
                    <p className="text-xs font-bold font-mono uppercase text-stone-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadError && (
            <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3 mt-2">
              {uploadError}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="project_description" className="block text-sm font-bold font-mono text-stone-900 uppercase tracking-widest mb-2">
            <FileText className="inline w-4 h-4 mr-1.5 text-stone-900" />
            Project Description
          </label>
          <textarea
            id="project_description"
            name="project_description"
            required
            defaultValue={initialDescription}
            rows={4}
            placeholder="Describe what you built, the problem it solves, and the tech stack you used..."
            className="w-full px-4 py-3 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white transition resize-none"
          />
        </div>

        {/* Deploy Link */}
        <div>
          <label htmlFor="deploy_link" className="block text-sm font-bold font-mono text-stone-900 uppercase tracking-widest mb-2">
            <LinkIcon className="inline w-4 h-4 mr-1.5 text-stone-900" />
            Deploy Link
          </label>
          <input
            id="deploy_link"
            name="deploy_link"
            type="url"
            required
            defaultValue={initialDeployLink}
            placeholder="https://your-project.vercel.app"
            className="w-full px-4 py-3 bg-stone-100 border-2 border-stone-900 rounded-none text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white transition"
          />
        </div>

        {state?.error && (
          <p className="text-sm font-bold font-mono uppercase text-red-900 bg-red-100 border-2 border-red-900 px-4 py-3">
            {state.error}
          </p>
        )}

        {state?.success && (
          <p className="text-sm font-bold font-mono uppercase text-green-900 bg-green-100 border-2 border-green-900 px-4 py-3">
            🎉 Project submitted successfully!
          </p>
        )}

        <button
          type="submit"
          disabled={pending || uploading || !uploadedUrl}
          className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-900 border-2 border-stone-900 text-sm font-bold font-mono uppercase transition shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-y-[4px] active:translate-x-[4px]"
        >
          {pending ? 'Saving submission…' : isEditing ? 'Update Submission' : 'Submit Project'}
        </button>
        {!uploadedUrl && (
          <p className="text-xs font-bold font-mono uppercase text-stone-500 text-center mt-3">Please upload a screenshot to enable submission.</p>
        )}
      </form>
    </div>
  )
}

