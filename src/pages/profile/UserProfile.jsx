import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import DottedBackground from '../../components/DottedBackground';
import { useTranslation } from 'react-i18next';
import AutoTranslate from '../../components/AutoTranslate';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaFileAlt,
  FaDownload,
  FaBriefcase,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaSignOutAlt,
  FaGlobe,
  FaBuilding,
  FaClock,
  FaPlus,
  FaExclamationTriangle,
  FaShieldAlt,
} from 'react-icons/fa';
import { getImageUrl } from '../../utils/imageUrls';
import ProfileRecommendations from '../../components/reviews/ProfileRecommendations';
import { getSignedDownloadUrl } from '../../services/uploadApi';

const getRoleBadge = role => {
  const styles = {
    job_seeker: 'bg-primary/20 text-primary border-primary',
    employer: 'bg-success/20 text-success border-success',
    admin: 'bg-deep-blue/10 text-deep-blue border-deep-blue/20',
  };
  return styles[role] || styles.job_seeker;
};

// Utility moved to utils/imageUrls.js

const UserProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getMyProfile, logoutUser, deleteAccount, loading } = useUser();

  const [user, setUser] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState('');
  const [cvDownloadError, setCvDownloadError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getRoleLabel = role => {
    switch (role) {
      case 'employer':
        return t('auth.role_employer');
      case 'job_seeker':
        return t('auth.role_job_seeker');
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setUser(data);
      setImgError(false);
    } catch (err) {
      setError(err.message || t('profile.error_load_profile'));
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Redux still clears the local session when the backend is unreachable.
    } finally {
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError(t('profile.password_required'));
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      navigate('/login');
    } catch (err) {
      setDeleteError(err.message || t('profile.error_delete_account'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCvDownload = async cv => {
    try {
      setCvDownloadError('');
      const signedUrl = await getSignedDownloadUrl({
        publicId: cv?.public_id,
        url: cv?.url,
        attachment: false,
      });
      if (!signedUrl) throw new Error('Failed to generate download link');
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setCvDownloadError(err.message || 'Failed to download CV');
    }
  };

  if (loading && !user) {
    return (
      <DottedBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DottedBackground>
    );
  }

  if (error || !user) {
    return (
      <DottedBackground>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-6 text-center bg-surface border border-error/30 shadow-sm rounded-xl">
            <FaTimesCircle className="w-12 h-12 mx-auto mb-4 text-error" />
            <h2 className="text-xl font-bold text-text-dark mb-2">{t('profile.unable_to_load')}</h2>
            <p className="text-muted mb-4">{error || t('profile.sign_in_to_view')}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors"
            >
              {t('navbar.sign_in')}
            </Link>
          </div>
        </div>
      </DottedBackground>
    );
  }

  return (
    <DottedBackground>
      <div className="max-w-4xl px-6 py-8 mx-auto">
        {/* Profile Header Card */}
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 mb-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.profileImage && !imgError ? (
                <img
                  src={getImageUrl(user.profileImage)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    setImgError(true);
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-surface-muted rounded-full flex items-center justify-center border-2 border-border">
                  <span className="text-3xl font-bold text-primary">
                    {user.role === 'employer' ? (
                      <FaBriefcase className="w-10 h-10" />
                    ) : (
                      <>
                        {user.firstName?.[0]?.toUpperCase()}
                        {user.lastName?.[0]?.toUpperCase()}
                      </>
                    )}
                  </span>
                </div>
              )}
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-success rounded-full flex items-center justify-center border-2 border-white">
                  <FaCheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-1 leading-tight">
                    {user.firstName} {user.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadge(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                    {user.role === 'employer' && user.industry && (
                      <span className="px-3 py-1 text-xs font-medium text-muted bg-surface-muted border border-border rounded-full">
                        <AutoTranslate>{user.industry}</AutoTranslate>
                      </span>
                    )}
                    {user.isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-success font-medium">
                        <FaCheckCircle className="w-3 h-3" /> {t('profile.verified')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-warning">
                        <FaTimesCircle className="w-3 h-3" /> {t('profile.not_verified')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="w-4 h-4 text-subtle" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="w-4 h-4 text-subtle" />
                      <span>{user.phone}</span>
                    </div>
                    {user.location && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-subtle" />
                        <span>
                          {[user.location.village, user.location.district, user.location.province]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-shrink-0 flex-wrap gap-2 sm:justify-end">
                  <Link
                    to="/profile/edit"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-button hover:bg-deep-blue transition-colors text-sm font-semibold"
                  >
                    <FaEdit className="w-4 h-4" />
                    {t('profile.edit_profile')}
                  </Link>

                  {user.role === 'employer' && (
                    <Link
                      to="/employer/dashboard"
                      className="flex items-center gap-2 px-4 py-2 border border-border text-text-dark rounded-button hover:bg-surface-muted transition-colors text-sm font-semibold"
                    >
                      <FaBriefcase className="w-4 h-4" />
                      {t('navbar.dashboard')}
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-2 px-4 py-2 border border-border text-text-dark rounded-button hover:bg-surface-muted transition-colors text-sm font-semibold"
                    >
                      <FaShieldAlt className="w-4 h-4" />
                      {t('navbar.dashboard')}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 border border-border text-text-dark rounded-button hover:bg-surface-muted transition-colors text-sm font-semibold"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    {t('navbar.sign_out')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Employer: Company about */}
            {user.role === 'employer' && (
              <div className="bg-surface rounded-xl shadow-sm border border-border p-6 text-center sm:text-left">
                <h2 className="text-xl font-bold text-text-dark mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FaBriefcase className="w-4 h-4 text-primary" />
                  </div>
                  {t('profile.company_overview')}
                </h2>
                <div className="space-y-4">
                  {user.companyName && (
                    <div>
                      <h3 className="text-sm font-semibold tracking-wider text-subtle uppercase">
                        {t('profile.company_name')}
                      </h3>
                      <p className="text-lg font-bold text-text-dark">{user.companyName}</p>
                    </div>
                  )}
                  {user.industry && (
                    <div>
                      <h3 className="text-sm font-semibold tracking-wider text-subtle uppercase">
                        {t('profile.industry')}
                      </h3>
                      <p className="text-text-dark font-medium">
                        <AutoTranslate>{user.industry}</AutoTranslate>
                      </p>
                    </div>
                  )}
                  {user.companyWebsite && (
                    <div>
                      <h3 className="text-sm font-semibold tracking-wider text-subtle uppercase">
                        {t('profile.website')}
                      </h3>
                      <a
                        href={
                          user.companyWebsite.startsWith('http')
                            ? user.companyWebsite
                            : `https://${user.companyWebsite}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        {user.companyWebsite}
                      </a>
                    </div>
                  )}
                  {user.companyDescription && (
                    <div>
                      <h3 className="text-sm font-semibold tracking-wider text-subtle uppercase">
                        {t('auth.company_description')}
                      </h3>
                      <p className="text-muted leading-relaxed whitespace-pre-line">
                        <AutoTranslate>{user.companyDescription}</AutoTranslate>
                      </p>
                    </div>
                  )}
                  {!user.companyName && !user.industry && !user.companyDescription && (
                    <div className="py-4 text-center">
                      <p className="italic text-subtle">{t('profile.no_company_details')}</p>
                      <Link
                        to="/profile/edit"
                        className="text-primary text-sm font-medium mt-2 inline-block"
                      >
                        {t('profile.add_company_info')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job Seeker Sections */}
            {user.role !== 'employer' && (
              <>
                {/* Skills */}
                <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                  <h2 className="text-xl font-bold text-text-dark mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FaUser className="w-4 h-4 text-primary" />
                    </div>
                    {t('profile.skills')}
                  </h2>
                  {user.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20"
                        >
                          <AutoTranslate>{skill}</AutoTranslate>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-subtle">{t('profile.no_skills')}</p>
                  )}
                </div>

                {/* Experience */}
                <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                  <h2 className="text-xl font-bold text-text-dark mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                      <FaBriefcase className="w-4 h-4 text-success" />
                    </div>
                    {t('profile.experience')}
                  </h2>
                  {user.experience && user.experience.length > 0 ? (
                    <div className="space-y-4">
                      {user.experience.map((exp, index) => (
                        <div
                          key={index}
                          className="flex gap-4 pb-4 border-b border-surface-muted last:border-0 last:pb-0"
                        >
                          <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                            <FaBriefcase className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-dark">{exp.title}</h3>
                            <p className="text-muted text-sm font-medium">{exp.company}</p>
                            {exp.duration && (
                              <p className="text-xs text-subtle mt-0.5">{exp.duration}</p>
                            )}
                            {exp.description && (
                              <p className="text-sm text-muted mt-2">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-subtle">{t('profile.no_experience')}</p>
                  )}
                </div>

                {/* CVs */}
                <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                  <h2 className="text-xl font-bold text-text-dark mb-4 flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <FaFileAlt className="w-4 h-4 text-primary" />
                    </div>
                    {t('profile.uploaded_cvs')}
                  </h2>
                  {cvDownloadError && <p className="text-sm text-error mb-3">{cvDownloadError}</p>}
                  {user.cvs && user.cvs.length > 0 ? (
                    <div className="space-y-3">
                      {user.cvs.map((cv, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-surface-muted rounded-lg border border-border hover:border-primary transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-error/10 rounded-lg">
                              <FaFileAlt className="w-5 h-5 text-error" />
                            </div>
                            <div>
                              <p className="font-medium text-text-dark text-sm">{cv.name}</p>
                              <div className="flex items-center gap-2">
                                {cv.isPrimary && (
                                  <span className="text-xs text-primary font-medium">
                                    {t('common.primary')}
                                  </span>
                                )}
                                <p className="text-xs text-subtle">{formatDate(cv.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCvDownload(cv)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <FaDownload className="w-3.5 h-3.5" />
                            {t('common.download')}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-subtle">{t('profile.no_cvs')}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Account Info */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-text-dark mb-4">
                {t('profile.account_information')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-surface-muted">
                  <span className="text-sm text-muted">{t('profile.member_since')}</span>
                  <span className="text-sm font-medium text-text-dark">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-surface-muted">
                  <span className="text-sm text-muted">{t('profile.account_status')}</span>
                  <span
                    className={`text-sm font-medium ${user.isActive ? 'text-success' : 'text-error'}`}
                  >
                    {user.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted">{t('profile.verification')}</span>
                  <span
                    className={`text-sm font-medium ${user.isVerified ? 'text-success' : 'text-warning'}`}
                  >
                    {user.isVerified ? t('common.verified') : t('common.pending')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-text-dark mb-4">{t('profile.quick_actions')}</h3>
              <div className="space-y-2">
                <Link
                  to="/profile/edit"
                  className="flex items-center gap-3 p-3 text-muted hover:bg-surface-muted rounded-lg transition-colors w-full text-left text-sm"
                >
                  <FaEdit className="w-4 h-4 text-primary" />
                  {t('profile.edit_profile')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 text-muted hover:bg-surface-muted rounded-lg transition-colors w-full text-left text-sm"
                >
                  <FaSignOutAlt className="w-4 h-4 text-muted" />
                  {t('navbar.sign_out')}
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center w-full gap-3 p-3 text-sm text-left text-error transition-colors rounded-lg hover:bg-error/10"
                >
                  <FaTrash className="w-4 h-4" />
                  {t('profile.delete_account')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ProfileRecommendations />
        </div>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-surface rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-error/10 rounded-full">
                <FaTrash className="w-5 h-5 text-error" />
              </div>
              <h3 className="text-lg font-semibold text-text-dark">
                {t('profile.delete_account')}
              </h3>
            </div>
            <p className="text-muted mb-4">{t('profile.delete_account_warning')}</p>
            {deleteError && (
              <div className="p-3 mb-4 border border-error/30 rounded-lg bg-error/10">
                <p className="text-sm text-error">{deleteError}</p>
              </div>
            )}
            <input
              type="password"
              value={deletePassword}
              onChange={e => {
                setDeletePassword(e.target.value);
                setDeleteError('');
              }}
              placeholder={t('profile.enter_password_placeholder')}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-error focus:border-transparent outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-muted hover:bg-surface-muted rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 text-white transition-colors bg-error rounded-lg hover:bg-error disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" />
                ) : (
                  t('profile.delete_account')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DottedBackground>
  );
};

export default UserProfile;
