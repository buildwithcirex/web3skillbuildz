'use client'

import { useActionState, useRef, useState } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    setUploading(true)
    const supabase = createClient()

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
    setUploading(false)
  }

  if (isLocked) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-amber-700" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Submissions are Locked</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          The event organizers have locked project submissions. New submissions and modifications are currently closed.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Your Project Submission' : 'Submit Your Project'}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing
              ? 'Update your project description, deploy link, or screenshot.'
              : 'Upload your screenshot, add a description and deploy link.'}
          </p>
        </div>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
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
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            <ImageIcon className="inline w-4 h-4 mr-1.5 text-indigo-600" />
            Project Screenshot
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl cursor-pointer transition ${
              previewUrl
                ? 'border-indigo-300 bg-indigo-50/50'
                : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            {previewUrl ? (
              <div className="p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-56 object-cover rounded-lg border border-gray-200"
                />
                <p className="text-xs text-indigo-600 text-center mt-2 font-medium">✓ Uploaded — click to change screenshot</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                {uploading ? (
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Click to upload screenshot</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
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
        </div>

        {/* Description */}
        <div>
          <label htmlFor="project_description" className="block text-sm font-semibold text-gray-800 mb-1.5">
            <FileText className="inline w-4 h-4 mr-1.5 text-indigo-600" />
            Project Description
          </label>
          <textarea
            id="project_description"
            name="project_description"
            required
            defaultValue={initialDescription}
            rows={4}
            placeholder="Describe what you built, the problem it solves, and the tech stack you used..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
          />
        </div>

        {/* Deploy Link */}
        <div>
          <label htmlFor="deploy_link" className="block text-sm font-semibold text-gray-800 mb-1.5">
            <LinkIcon className="inline w-4 h-4 mr-1.5 text-indigo-600" />
            Deploy Link
          </label>
          <input
            id="deploy_link"
            name="deploy_link"
            type="url"
            required
            defaultValue={initialDeployLink}
            placeholder="https://your-project.vercel.app"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {state.error}
          </p>
        )}

        {state?.success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            🎉 Project submitted successfully!
          </p>
        )}

        <button
          type="submit"
          disabled={pending || uploading || !uploadedUrl}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition shadow-sm"
        >
          {pending ? 'Saving submission…' : isEditing ? 'Update Submission' : 'Submit Project'}
        </button>
        {!uploadedUrl && (
          <p className="text-xs text-center text-gray-400">Please upload a screenshot to enable submission.</p>
        )}
      </form>
    </div>
  )
}
