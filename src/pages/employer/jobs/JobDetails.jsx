import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useJobs } from '../../../hooks/useJobs';
import parse from 'html-react-parser';
import { sanitizeJobDescription } from '../../../utils/sanitizeJobDescription';
import { useTranslation } from 'react-i18next';

import DottedBackground from '../../../components/DottedBackground';
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaDollarSign,
  FaUsers,
  FaGlobe,
  FaEdit,
  FaTimesCircle,
  FaCheckCircle,
  FaTrash,
  FaFileAlt,
} from 'react-icons/fa';
import { getImageUrl } from '../../../utils/imageUrls';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    fetchJobById,
    closeJob,
    markJobAsFilled,
    deleteJob,
    loading,
    error: contextError,
  } = useJobs();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPublicView = searchParams.get('public') === 'true';

  const loadJob = async () => {
    if (!id) {
      setError('Job ID is required');
      return;
    }
    try {
      const data = await fetchJobById(id);
      setJob(data);
    } catch (err) {
      setError(err.message || 'Failed to load job details');
      console.error('Error loading job:', err);
    }
  };

  useEffect(() => {
    if (id) {
      loadJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleAction = action => {
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    try {
      if (actionType === 'close') {
        await closeJob(job._id);
        setToast({ type: 'success', message: 'Job closed successfully.' });
      } else if (actionType === 'filled') {
        await markJobAsFilled(job._id);
        setToast({ type: 'success', message: 'Job marked as filled successfully.' });
      } else if (actionType === 'delete') {
        await deleteJob(job._id);
        setToast({ type: 'success', message: 'Job deleted successfully.' });
      }
      setShowConfirmDialog(false);
      window.setTimeout(() => navigate('/employer/my-jobs'), 800);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Action failed' });
      setShowConfirmDialog(false);
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    if (!dateString || Number.isNaN(date.getTime())) return t('common.invalid_date');
    return date.toLocaleDateString(i18n.language || 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSalary = (amount, type, currency = 'LKR') => {
    // Handle optional salary fields
    if (!amount || amount === undefined || amount === null) {
      return 'Salary not specified';
    }
    if (!type || type === undefined || type === null) {
      return `${currency} ${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()} / ${type}`;
  };

  const employerCompanyName =
    job?.employer?.companyName ||
    job?.employerId?.companyName ||
    [job?.employer?.firstName, job?.employer?.lastName].filter(Boolean).join(' ').trim() ||
    [job?.employerId?.firstName, job?.employerId?.lastName].filter(Boolean).join(' ').trim() ||
    job?.employer?.email ||
    job?.employerId?.email ||
    'Unknown employer';

  const locationText =
    job?.location?.fullAddress ||
    [job?.location?.village, job?.location?.district, job?.location?.province]
      .filter(Boolean)
      .join(', ') ||
    'Location not specified';

  const openLocationInGoogleMaps = () => {
    if (!job?.location) return;

    const coordinates = job.location?.coordinates?.coordinates;
    let mapsUrl = '';

    if (Array.isArray(coordinates) && coordinates.length === 2) {
      const [lng, lat] = coordinates;
      mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    } else if (locationText && locationText !== 'Location not specified') {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
    }

    if (mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-success border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || contextError || !job) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl shadow-sm border border-error/30 p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-error mb-2">Error</h2>
          <p className="text-muted mb-4">{error || contextError || 'Job not found'}</p>
          <Link
            to="/employer/my-jobs"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors"
          >
            Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DottedBackground>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          to={isPublicView ? '/' : '/employer/dashboard'}
          className="inline-flex items-center text-muted hover:text-info transition-colors mb-6"
        >
          <FaArrowLeft className="w-5 h-5 mr-2" />
          {isPublicView ? 'Back to Jobs' : 'Back to Dashboard'}
        </Link>

        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden border border-neutral-100">
              {job.employer?.profileImage ? (
                <img
                  src={getImageUrl(job.employer.profileImage)}
                  alt="logo"
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <FaBriefcase className="w-8 h-8 text-subtle" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-dark mb-1">{job.title}</h1>
              <p className="text-lg text-muted">{job.jobRole || 'Job Position'}</p>
              <p className="text-sm text-subtle mt-1">{employerCompanyName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-muted">
              <FaBriefcase className="w-5 h-5 text-subtle" />
              <span className="capitalize">{job.employmentType || 'Full-time'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <FaGlobe className="w-5 h-5 text-subtle" />
              <button
                type="button"
                onClick={openLocationInGoogleMaps}
                className="text-left hover:text-primary hover:underline transition-colors"
                title="Open location in Google Maps"
              >
                {locationText}
              </button>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <FaDollarSign className="w-5 h-5 text-subtle" />
              <span className="font-semibold">
                {formatSalary(job.salaryAmount, job.salaryType, job.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-muted rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-text-dark mb-4">{t('job.job_information')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted mb-1">{t('job.employer')}</p>
              <p className="font-medium text-text-dark">{employerCompanyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">{t('job.category')}</p>
              <p className="font-medium text-text-dark capitalize">
                {job.categoryLabel || job.category}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">{t('job.employment_type')}</p>
              <p className="font-medium text-text-dark capitalize">
                {job.employmentType || 'Full-time'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">{t('job.positions_available')}</p>
              <p className="font-medium text-text-dark">
                {job.positions} {job.positions === 1 ? t('job.position') : t('job.positions')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">{t('job.experience_level')}</p>
              <p className="font-medium text-text-dark capitalize">
                {job.experienceRequired || 'None'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">{t('job.start_date')}</p>
              <p className="font-medium text-text-dark">{formatDate(job.startDate)}</p>
            </div>
            {job.endDate && (
              <div>
                <p className="text-sm text-muted mb-1">{t('job.end_date')}</p>
                <p className="font-medium text-text-dark">{formatDate(job.endDate)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 bg-surface rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-xl font-bold text-text-dark mb-4 flex items-center gap-2">
            <FaFileAlt className="w-5 h-5 text-subtle" />
            {t('job.job_description')}
          </h2>
          <div className="border-t border-neutral-100 pt-4">
            <div className="prose prose-lg max-w-none text-muted leading-relaxed">
              {parse(sanitizeJobDescription(job.description) || t('job.no_description'))}
            </div>
          </div>
        </div>

        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-text-dark mb-4">{t('job.skills')}</h2>
            <ul className="space-y-2">
              {job.skillsRequired.map((skill, index) => (
                <li key={index} className="flex items-start gap-2 text-muted">
                  <span className="text-success mt-1">•</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isPublicView && (
          <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
            <button
              onClick={() => navigate(`/employer/jobs/${job._id}/edit`)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors font-medium flex items-center gap-2"
            >
              <FaEdit className="w-5 h-5" />
              Edit Job
            </button>
            <button
              onClick={() => handleAction('close')}
              disabled={job.status !== 'open'}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-deep-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <FaTimesCircle className="w-5 h-5" />
              Close Job
            </button>
            <button
              onClick={() => handleAction('filled')}
              disabled={job.status !== 'open'}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <FaCheckCircle className="w-5 h-5" />
              Mark as Filled
            </button>
            <button
              onClick={() => handleAction('delete')}
              className="px-6 py-3 bg-error text-white rounded-lg hover:bg-error transition-colors font-medium flex items-center gap-2 ml-auto"
            >
              <FaTrash className="w-5 h-5" />
              Delete Job
            </button>
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-dark mb-2">Confirm Action</h3>
            <p className="text-muted mb-6">
              Are you sure you want to {actionType} this job?
              {actionType === 'delete' && ' This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-muted hover:bg-surface-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${actionType === 'delete' ? 'bg-error hover:bg-error' : 'bg-primary hover:bg-deep-blue'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-4 bottom-4 z-[60] max-w-sm w-[calc(100%-2rem)] sm:w-auto">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-start gap-2 text-white ${
              toast.type === 'success' ? 'bg-success' : 'bg-error'
            }`}
          >
            <FaTimesCircle className="w-4 h-4 mt-0.5" />
            <span className="text-sm leading-relaxed">{toast.message}</span>
          </div>
        </div>
      )}
    </DottedBackground>
  );
};

export default JobDetails;
