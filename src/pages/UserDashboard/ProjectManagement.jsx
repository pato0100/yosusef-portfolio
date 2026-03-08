import CoverCropper from '../../components/CoverCropper'

export default function ProjectManagement({
  lang,
  projectLang,
  setProjectLang,
  projectsLang,
  newProject,
  setNewProject,
  cleanProjectSlug,
  createProject,
  loadingProjects,
  projects,
  activeProjectId,
  setActiveProjectId,
  editingProjects,
  setEditingProjects,
  updateProject,
  croppingImage,
  setCroppingImage,
  uploadCover,
  previewImages,
  setPreviewImages,
  selectedFiles,
  setSelectedFiles,
  uploadGallery,
  moveImage,
  deleteGalleryImage,
}) {
  return (
    <section
      className={`card p-6 ${projectLang === 'ar' ? 'text-right' : 'text-left'}`}
      dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
    >
      <h2 className="text-lg font-bold mb-4">
        {projectsLang === 'ar' ? 'إدارة المشاريع' : 'Project Management'}
      </h2>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm opacity-70">
          {projectsLang === 'ar' ? 'لغة محتوى المشروع:' : 'Project content:'}
        </span>

        <div className="inline-flex rounded-full border border-[var(--card-border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setProjectLang('en')}
            className={`px-3 py-1 text-sm ${
              projectLang === 'en' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''
            }`}
          >
            EN
          </button>

          <button
            type="button"
            onClick={() => setProjectLang('ar')}
            className={`px-3 py-1 text-sm ${
              projectLang === 'ar' ? 'bg-[var(--brand)] text-[var(--brand-contrast)]' : ''
            }`}
          >
            AR
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input
          className="input"
          placeholder={projectLang === 'ar' ? 'عنوان المشروع' : 'Project title'}
          value={newProject.title}
          onChange={(e) => {
            const title = e.target.value
            setNewProject((prev) => ({
              ...prev,
              title,
              slug: cleanProjectSlug(title),
            }))
          }}
        />

        <div className="flex items-center rounded-xl border border-white/15 bg-white/5 overflow-hidden">
          <span className="px-3 text-xs opacity-60 whitespace-nowrap">
            {projectLang === 'ar' ? '/المشاريع/' : '/projects/'}
          </span>

          <input
            className="bg-transparent flex-1 px-2 py-2 outline-none"
            value={newProject.slug}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                slug: cleanProjectSlug(e.target.value),
              }))
            }
          />
        </div>

        <input
          className="input"
          placeholder={projectLang === 'ar' ? 'الوصف المختصر' : 'Short description'}
          value={newProject.short_description}
          onChange={(e) =>
            setNewProject((prev) => ({ ...prev, short_description: e.target.value }))
          }
        />
      </div>

      <button onClick={createProject} className="btn btn-primary mb-6">
        {projectLang === 'ar' ? 'إضافة مشروع' : 'Add Project'}
      </button>

      {loadingProjects ? (
        <p>Loading projects...</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="border border-white/10 rounded-xl p-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => {
                  if (activeProjectId === project.id) {
                    setActiveProjectId(null)
                  } else {
                    setActiveProjectId(project.id)
                    setEditingProjects((prev) => ({
                      ...prev,
                      [project.id]: { ...project },
                    }))
                  }
                }}
              >
                <div>
                  <div className="font-semibold">
                    {projectLang === 'ar' ? project.title_ar : project.title_en}
                  </div>
                  <div className="text-sm opacity-70">{project.slug}</div>
                </div>

                <div className="text-xs opacity-60">
                  {activeProjectId === project.id
                    ? projectLang === 'ar'
                      ? 'إغلاق'
                      : 'Close'
                    : projectLang === 'ar'
                    ? 'إدارة'
                    : 'Manage'}
                </div>
              </div>

              {activeProjectId === project.id && (
                <div className="mt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm opacity-70">
                        {projectLang === 'ar' ? ' عنوان المشروع ' : ' Project Title '}
                      </label>

                      <input
                        className="input"
                        value={
                          projectLang === 'ar'
                            ? editingProjects[project.id]?.title_ar || ''
                            : editingProjects[project.id]?.title_en || ''
                        }
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              [projectLang === 'ar' ? 'title_ar' : 'title_en']: e.target.value,
                            },
                          }))
                        }
                        dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <label className="text-sm opacity-70">
                        {projectLang === 'ar' ? 'الوصف المختصر' : 'Short Description'}
                      </label>

                      <input
                        className="input"
                        dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
                        value={
                          projectLang === 'ar'
                            ? editingProjects[project.id]?.short_description_ar || ''
                            : editingProjects[project.id]?.short_description_en || ''
                        }
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              [projectLang === 'ar'
                                ? 'short_description_ar'
                                : 'short_description_en']: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm opacity-70">
                      {projectLang === 'ar' ? 'الوصف الكامل' : 'Full Description'}
                    </label>

                    <textarea
                      className="input min-h-[120px]"
                      dir={projectLang === 'ar' ? 'rtl' : 'ltr'}
                      value={
                        projectLang === 'ar'
                          ? editingProjects[project.id]?.full_description_ar || ''
                          : editingProjects[project.id]?.full_description_en || ''
                      }
                      onChange={(e) =>
                        setEditingProjects((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...prev[project.id],
                            [projectLang === 'ar'
                              ? 'full_description_ar'
                              : 'full_description_en']: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm opacity-70">
                      {projectLang === 'ar'
                        ? 'التقنيات المستخدمة (افصل بفاصلة)'
                        : 'Tech Stack (comma separated)'}
                    </label>

                    <input
                      className="input"
                      value={(editingProjects[project.id]?.tech_stack || []).join(', ')}
                      onChange={(e) =>
                        setEditingProjects((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...prev[project.id],
                            tech_stack: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm opacity-70">
                      {projectLang === 'ar'
                        ? 'المميزات (افصل بفاصلة)'
                        : 'Features (comma separated)'}
                    </label>

                    <input
                      className="input"
                      value={(editingProjects[project.id]?.features || []).join(', ')}
                      onChange={(e) =>
                        setEditingProjects((prev) => ({
                          ...prev,
                          [project.id]: {
                            ...prev[project.id],
                            features: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm opacity-70 block mb-1">
                        {projectLang === 'ar' ? 'رابط GitHub' : 'GitHub URL'}
                      </label>

                      <input
                        type="url"
                        dir="ltr"
                        className="input text-left"
                        value={editingProjects[project.id]?.github_url || ''}
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              github_url: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://github.com/username/project"
                      />
                    </div>

                    <div>
                      <label className="text-sm opacity-70 block mb-1">
                        {projectLang === 'ar' ? 'الرابط المباشر' : 'Live URL'}
                      </label>

                      <input
                        type="url"
                        dir="ltr"
                        className="input text-left"
                        value={editingProjects[project.id]?.live_url || ''}
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              live_url: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm opacity-70">
                        {projectLang === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                      </label>

                      <input
                        type="date"
                        className="input"
                        value={editingProjects[project.id]?.start_date || ''}
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              start_date: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm opacity-70">
                        {projectLang === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                      </label>

                      <input
                        type="date"
                        className="input"
                        value={editingProjects[project.id]?.end_date || ''}
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              end_date: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className={`flex gap-6 ${projectLang === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!editingProjects[project.id]?.is_active}
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              is_active: e.target.checked,
                            },
                          }))
                        }
                      />
                      {projectLang === 'ar' ? 'نشط' : 'Active'}
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!editingProjects[project.id]?.is_featured}
                        onChange={(e) =>
                          setEditingProjects((prev) => ({
                            ...prev,
                            [project.id]: {
                              ...prev[project.id],
                              is_featured: e.target.checked,
                            },
                          }))
                        }
                      />
                      {projectLang === 'ar' ? 'مميز' : 'Featured'}
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={async () => {
                        const values = { ...editingProjects[project.id] }

                        delete values.id
                        delete values.created_at
                        delete values.updated_at
                        delete values.views
                        delete values.owner_id

                        await updateProject(project.id, values)
                        alert('Project updated ✅')
                      }}
                      className="btn btn-primary"
                    >
                      {projectLang === 'ar' ? 'تحديث المشروع' : 'Update Project'}
                    </button>

                    <button
                      onClick={() =>
                        setEditingProjects((prev) => ({
                          ...prev,
                          [project.id]: { ...project },
                        }))
                      }
                      className="btn btn-ghost"
                    >
                      {projectLang === 'ar' ? 'إعادة تعيين' : 'Reset'}
                    </button>
                  </div>

                  <div>
                    <label className="text-sm opacity-70">
                      {projectLang === 'ar' ? 'رفع صورة الغلاف' : 'Upload Cover'}
                    </label>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (!file) return

                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setCroppingImage((prev) => ({
                            ...prev,
                            [project.id]: ev.target.result,
                          }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />

                    {croppingImage[project.id] && (
                      <CoverCropper
                        image={croppingImage[project.id]}
                        onCancel={() =>
                          setCroppingImage((prev) => ({
                            ...prev,
                            [project.id]: null,
                          }))
                        }
                        onConfirm={async (croppedBase64) => {
                          const blob = await (await fetch(croppedBase64)).blob()
                          const file = new File([blob], 'cover.jpg', {
                            type: 'image/jpeg',
                          })

                          await uploadCover(file, project)

                          setCroppingImage((prev) => ({
                            ...prev,
                            [project.id]: null,
                          }))
                        }}
                      />
                    )}

                    {project.cover_image && !croppingImage[project.id] && (
                      <div className="mt-3 space-y-2">
                        <img
                          src={project.cover_image}
                          className="rounded-xl h-40 object-cover border border-white/10"
                        />

                        <button
                          onClick={() => updateProject(project.id, { cover_image: null })}
                          className="btn btn-ghost"
                        >
                          {projectLang === 'ar' ? 'حذف الغلاف' : 'Remove Cover'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm opacity-70">
                      {projectLang === 'ar' ? 'رفع صور المشروع' : 'Upload Gallery'}
                    </label>

                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const files = Array.from(e.target.files)

                        setSelectedFiles((prev) => ({
                          ...prev,
                          [project.id]: files,
                        }))

                        setPreviewImages((prev) => ({
                          ...prev,
                          [project.id]: files.map((file) => URL.createObjectURL(file)),
                        }))
                      }}
                    />

                    {previewImages[project.id]?.length > 0 && (
                      <>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {previewImages[project.id].map((src) => (
                            <img key={src} src={src} className="rounded-lg opacity-60 h-24 object-cover" />
                          ))}
                        </div>

                        <div className="flex gap-3 mt-3">
                          <button
                            onClick={() => {
                              uploadGallery(selectedFiles[project.id], project)

                              setSelectedFiles((prev) => ({
                                ...prev,
                                [project.id]: null,
                              }))

                              setPreviewImages((prev) => ({
                                ...prev,
                                [project.id]: null,
                              }))
                            }}
                            className="btn btn-primary"
                          >
                            {projectLang === 'ar' ? 'تأكيد الرفع' : 'Confirm Upload'}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedFiles((prev) => ({
                                ...prev,
                                [project.id]: null,
                              }))
                              setPreviewImages((prev) => ({
                                ...prev,
                                [project.id]: null,
                              }))
                            }}
                            className="btn btn-ghost"
                          >
                            {projectLang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {project.gallery?.map((img) => (
                    <div key={img} className="relative group">
                      <img src={img} className="rounded-lg border border-white/10" />

                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => moveImage(project, img, -1)}
                          className="bg-black/70 px-2 py-1 text-xs rounded"
                        >
                          ↑
                        </button>

                        <button
                          onClick={() => moveImage(project, img, 1)}
                          className="bg-black/70 px-2 py-1 text-xs rounded"
                        >
                          ↓
                        </button>
                      </div>

                      <button
                        onClick={() => deleteGalleryImage(project, img)}
                        className="absolute top-2 right-2 bg-black/70 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}