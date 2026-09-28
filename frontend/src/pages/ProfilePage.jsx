import { useEffect, useRef, useState } from 'react'
import api, { getImageUrl } from '../api'
import { useAuth } from '../context/AuthContext'

function initials(name = '') {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [password, setPassword] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    api.get('/me').then(response => {
      setProfile({ name: response.data.name, email: response.data.email })
      updateUser(response.data)
    })
  }, [])

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  function chooseFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoError('')
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadPhoto() {
    if (!selectedFile) return setPhotoError('Choose an image first.')
    const formData = new FormData()
    formData.append('image', selectedFile)
    setUploadingPhoto(true)
    setPhotoError('')
    try {
      const response = await api.post('/me/avatar', formData)
      updateUser(response.data.user)
      setSelectedFile(null)
      setPreviewUrl('')
      setNotice('Profile photo updated.')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setPhotoError(error.response?.data?.error || 'Could not upload the photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setNotice('')
    try {
      const response = await api.put('/me', profile)
      updateUser(response.data.user)
      setNotice('Profile updated successfully.')
    } catch (error) {
      setProfileError(error.response?.status === 409 ? 'That email is already in use.' : error.response?.data?.error || 'Could not update your profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  function updatePasswordField(field, value) {
    setPassword(current => ({ ...current, [field]: value }))
    setPasswordError('')
    setCurrentPasswordError('')
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordError('')
    setCurrentPasswordError('')
    if (password.new_password.length < 6) return setPasswordError('New password must be at least 6 characters.')
    if (password.new_password !== password.confirm_password) return setPasswordError('Passwords do not match.')

    setSavingPassword(true)
    try {
      await api.put('/me/password', password)
      setPassword({ current_password: '', new_password: '', confirm_password: '' })
      setNotice('Password changed successfully.')
    } catch (error) {
      if (error.response?.status === 401) setCurrentPasswordError('Current password is incorrect.')
      else setPasswordError(error.response?.data?.error || 'Could not change your password.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) return null
  const displayedAvatar = previewUrl || getImageUrl(user.avatar_url)

  return (
    <div className="container fade-in profile-page">
      <h2>My Profile</h2>
      <p className="text-muted" style={{ marginTop: -8 }}>Manage your account details and security.</p>
      {notice && <p className="profile-notice">{notice}</p>}

      <div className="profile-grid">
        <section className="card profile-section">
          <h3>Profile picture</h3>
          {displayedAvatar ? <img src={displayedAvatar} alt="Profile" className="avatar avatar-lg" /> : <div className="avatar avatar-lg avatar-placeholder">{initials(user.name)}</div>}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} hidden />
          <div className="profile-actions">
            <button className="btn btn-secondary" type="button" onClick={() => fileInputRef.current?.click()}>Change photo</button>
            <button className="btn" type="button" onClick={uploadPhoto} disabled={!selectedFile || uploadingPhoto}>{uploadingPhoto ? 'Uploading...' : 'Upload'}</button>
          </div>
          {photoError && <p className="text-danger">{photoError}</p>}
        </section>

        <section className="card profile-section">
          <h3>Edit profile</h3>
          <form onSubmit={saveProfile} className="profile-form">
            <label>Name<input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} required /></label>
            <label>Email<input type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} required /></label>
            {profileError && <p className="text-danger">{profileError}</p>}
            <button className="btn" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</button>
          </form>
          {user.created_at && <p className="text-muted">Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>}
        </section>

        <section className="card profile-section">
          <h3>Change password</h3>
          <form onSubmit={changePassword} className="profile-form">
            <label>Current password<input type="password" value={password.current_password} onChange={event => updatePasswordField('current_password', event.target.value)} required /></label>
            {currentPasswordError && <p className="text-danger">{currentPasswordError}</p>}
            <label>New password<input type="password" value={password.new_password} onChange={event => updatePasswordField('new_password', event.target.value)} required /></label>
            <label>Confirm new password<input type="password" value={password.confirm_password} onChange={event => updatePasswordField('confirm_password', event.target.value)} required /></label>
            {passwordError && <p className="text-danger">{passwordError}</p>}
            <button className="btn" disabled={savingPassword}>{savingPassword ? 'Changing...' : 'Change password'}</button>
          </form>
        </section>
      </div>
    </div>
  )
}
