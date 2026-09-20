import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useJobs } from '../hooks/useJobs';
import { useUser } from '../hooks/useUser';
import { useTranslation } from 'react-i18next';
import {
  loadMyApplications,
  selectHasAppliedToJob,
  selectAppliedJobIdsLoaded,
} from '../store/slices/applicationSlice';
import parse from 'html-react-parser';
import { sanitizeJobDescription } from '../utils/sanitizeJobDescription';

import DottedBackground from '../components/DottedBackground';
import ApplyModal from '../components/applications/ApplyModal';
import SkillGapModal from '../components/SkillGapModal';
import {
  FaArrowLeft,
  FaBriefcase,
  FaDollarSign,
  FaGlobe,
  FaFileAlt,
  FaSignInAlt,
  FaPaperPlane,
  FaUsers,
  FaCheckCircle,
  FaChartBar,
} from 'react-icons/fa';
import { getImageUrl } from '../utils/imageUrls';

const STATUS_COLORS = {
  open: 'bg-success/10 text-success',
  closed: 'bg-error/10 text-error',
  filled: 'bg-info/10 text-info',
};

const PublicJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { fetchJobById, loading } = useJobs();
  const { currentUser } = useUser();

  const hasApplied = useSelector(selectHasAppliedToJob(id));
  const appliedLoaded = useSelector(selectAppliedJobIdsLoaded);

  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [skillGapModalOpen, setSkillGapModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load applied job IDs for "already applied" persistence (job seeker only)
  useEffect(() => {
    if (currentUser?.role === 'job_seeker' && !appliedLoaded) {
      dispatch(loadMyApplications({ limit: 100 }));
    }
  }, [currentUser?.role, appliedLoaded, dispatch]);

  useEffect(() => {
    if (!id) {
      setError('Job ID is required');
      setIsInitialLoading(false);
      return;
    }

    let cancelled = false;
    setIsInitialLoading(true);
    setError('');
    setJob(null);
    (async () => {
      try {
        const data = await fetchJobById(id);
        if (!cancelled) setJob(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load job details');
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived values
  const isGuest = !currentUser;
  const isSeeker = currentUser?.role === 'job_seeker';
  const isOwner =
    currentUser?.role === 'employer' &&
    (job?.employerId?._id === currentUser._id || job?.employerId === currentUser._id);

  const getEmployerAndCompany = () => {
    const result = { companyName: 'Unknown employer', logo: null };
    if (!job) return result;

    const maybe = obj => (obj && typeof obj === 'object' ? obj : null);

    const employerObj =
      maybe(job.employer) || maybe(job.employerId) || maybe(job.employerInfo) || null;
    const companyObj = maybe(job.company) || (employerObj && maybe(employerObj.company)) || null;

    if (employerObj) {
      result.companyName = employerObj.companyName || employerObj.company || result.companyName;

      result.logo =
        employerObj.profileImage ||
        employerObj.logo ||
        employerObj.companyLogo ||
        employerObj.avatar ||
        result.logo;
    }

    if (companyObj) {
      result.companyName =
        companyObj.name || companyObj.companyName || companyObj.title || result.companyName;
      result.logo =
        result.logo || companyObj.logo || companyObj.companyLogo || companyObj.image || result.logo;
    }

    if (typeof job.company === 'string') result.companyName = job.company;
    if (job.companyName && typeof job.companyName === 'string')
      result.companyName = job.companyName;

    return result;
  };

  const { companyName: employerCompany, logo: employerLogo } = getEmployerAndCompany();

  const locationText =
    job?.location?.fullAddress ||
    [job?.location?.village, job?.location?.district, job?.location?.province]
      .filter(Boolean)
      .join(', ') ||
    'Location not specified';

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
    if (!amount) return 'Salary not specified';
    if (!type) return `${currency} ${amount.toLocaleString()}`;
    return `${currency} ${amount.toLocaleString()} / ${type}`;
  };

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
    if (mapsUrl) window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Loading / Error states
  if (loading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-success border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isInitialLoading && (error || !job)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl shadow-sm border border-error/30 p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-error mb-2">Error</h2>
          <p className="text-muted mb-4">{error || 'Job not found'}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Render
  return (
    <DottedBackground>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-8">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center text-muted hover:text-info transition-colors mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
          Back to Jobs
        </Link>

        {/* Header */}
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden border border-neutral-100 shrink-0">
              {employerLogo ? (
                <img
                  src={getImageUrl(employerLogo)}
                  alt="logo"
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <FaBriefcase className="w-7 h-7 sm:w-8 sm:h-8 text-subtle" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-dark break-words">
                  {job.title}
                </h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize w-fit ${STATUS_COLORS[job.status] || 'bg-neutral-100 text-text-dark'}`}
                >
                  {job.status}
                </span>
              </div>
              <p className="text-base sm:text-lg text-muted mt-1 break-words">
                {job.jobRole || 'Job Position'}
              </p>
              <p className="text-sm text-subtle mt-1 break-words">{employerCompany}</p>
            </div>
          </div>

          {/* Details bar */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-6 sm:gap-y-3 pt-4 border-t border-border">
            <div className="flex items-start gap-2 text-muted min-w-0 sm:items-center">
              <FaBriefcase className="w-5 h-5 text-subtle shrink-0 mt-0.5 sm:mt-0" />
              <span className="capitalize">{job.employmentType || 'Full-time'}</span>
            </div>
            <div className="flex items-start gap-2 text-muted min-w-0 sm:items-center sm:max-w-full">
              <FaGlobe className="w-5 h-5 text-subtle shrink-0 mt-0.5 sm:mt-0" />
              <button
                type="button"
                onClick={openLocationInGoogleMaps}
                className="text-left hover:text-primary hover:underline transition-colors break-words"
                title="Open location in Google Maps"
              >
                {locationText}
              </button>
            </div>
            <div className="flex items-start gap-2 text-muted min-w-0 sm:items-center">
              <FaDollarSign className="w-5 h-5 text-subtle shrink-0 mt-0.5 sm:mt-0" />
              <span className="font-semibold break-words">
                {formatSalary(job.salaryAmount, job.salaryType, job.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Job info grid */}
        <div className="bg-surface rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-3 sm:mb-4">
            {t('job.job_information')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted mb-1">{t('job.company')}</p>
              <p className="font-medium text-text-dark break-words">{employerCompany}</p>
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

        {/* Description */}
        <div className="mb-6 sm:mb-8 bg-surface rounded-xl shadow-sm border border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-text-dark flex items-center gap-2">
              <FaFileAlt className="w-5 h-5 text-subtle shrink-0" />
              {t('job.job_description')}
            </h2>
            {isSeeker && (
              <button
                onClick={() => setSkillGapModalOpen(true)}
                className="w-full sm:w-auto justify-center px-4 py-2 min-h-[40px] bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors font-medium inline-flex items-center gap-2"
              >
                <FaChartBar className="w-4 h-4 shrink-0" />
                {t('skill_gap.analyze_with_my_cv')}
              </button>
            )}
          </div>
          <div className="border-t border-neutral-100 pt-4 overflow-x-auto">
            <div className="prose prose-sm sm:prose-lg max-w-none text-muted leading-relaxed [&_img]:max-w-full [&_pre]:max-w-full [&_table]:block [&_table]:overflow-x-auto sm:[&_table]:table">
              {parse(
                sanitizeJobDescription(job.description) || t('job.no_description')
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        {job.skillsRequired?.length > 0 && (
          <div className="mb-6 sm:mb-8 bg-surface rounded-xl shadow-sm border border-border p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-dark mb-3 sm:mb-4">
              {t('job.skills')}
            </h2>
            <ul className="space-y-2">
              {job.skillsRequired.map((skill, i) => (
                <li key={i} className="flex items-start gap-2 text-muted">
                  <span className="text-success mt-1">•</span>
                  <span className="break-words">{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Section */}
        <div className="pt-4 sm:pt-6 border-t border-border">
          {/* Guest → Login to Apply */}
          {isGuest && (
            <button
              onClick={() => navigate('/login', { state: { from: `/jobs/${id}` } })}
              className="w-full sm:w-auto justify-center px-6 py-3 min-h-[44px] bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors font-medium inline-flex items-center gap-2"
            >
              <FaSignInAlt className="w-5 h-5 shrink-0" />
              Login to Apply
            </button>
          )}

          {/* Job seeker → Already applied (show regardless of job status) */}
          {isSeeker && hasApplied && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <div className="inline-flex w-full sm:w-auto justify-center px-6 py-3 min-h-[44px] bg-neutral-100 text-muted rounded-lg font-medium items-center gap-2">
                <FaCheckCircle className="w-5 h-5 text-success shrink-0" />
                You have already applied
              </div>
              <button
                onClick={() => setSkillGapModalOpen(true)}
                className="w-full sm:w-auto justify-center px-6 py-3 min-h-[44px] bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors font-medium inline-flex items-center gap-2"
              >
                <FaChartBar className="w-5 h-5 shrink-0" />
                {t('skill_gap.analyze_with_my_cv')}
              </button>
              <Link
                to="/my-applications"
                className="text-sm text-primary hover:underline font-medium text-center sm:text-left py-1"
              >
                View My Applications
              </Link>
            </div>
          )}

          {/* Job seeker → Apply (only when job is open and hasn't applied) */}
          {isSeeker && job.status === 'open' && !hasApplied && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <button
                onClick={() => setApplyModalOpen(true)}
                className="w-full sm:w-auto justify-center px-6 py-3 min-h-[44px] bg-success text-white rounded-lg hover:bg-deep-blue transition-colors font-medium inline-flex items-center gap-2"
              >
                <FaPaperPlane className="w-5 h-5 shrink-0" />
                {t('applications.apply_now')}
              </button>
              <button
                onClick={() => setSkillGapModalOpen(true)}
                className="w-full sm:w-auto justify-center px-6 py-3 min-h-[44px] bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors font-medium inline-flex items-center gap-2"
              >
                <FaChartBar className="w-5 h-5 shrink-0" />
                {t('skill_gap.analyze_with_my_cv')}
              </button>
            </div>
          )}

          {/* Employer (own job) → Manage Applications */}
          {isOwner && (
            <Link
              to={`/employer/applications/job/${job._id}`}
              className="w-full sm:w-auto justify-center inline-flex px-6 py-3 min-h-[44px] bg-primary text-white rounded-lg hover:bg-deep-blue transition-colors font-medium items-center gap-2"
            >
              <FaUsers className="w-5 h-5 shrink-0" />
              Manage Applications
            </Link>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        jobId={job._id}
        jobTitle={job.title}
      />

      {/* Skill Gap Analysis Modal */}
      <SkillGapModal
        isOpen={skillGapModalOpen}
        onClose={() => setSkillGapModalOpen(false)}
        jobId={job._id}
        jobTitle={job.title}
      />
    </DottedBackground>
  );
};

export default PublicJobDetails;
