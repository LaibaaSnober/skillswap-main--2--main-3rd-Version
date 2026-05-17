import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from "../config/api";
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  Clock, 
  Star, 
  Send,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Github,
  CheckCircle,
  Award
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// Helper function for proficiency bar styling
const getProficiencyStyle = (proficiency) => {
  const levels = {
    'Beginner': { width: '25%', color: 'bg-blue-500', label: 'Beginner' },
    'Intermediate': { width: '50%', color: 'bg-yellow-500', label: 'Intermediate' },
    'Advanced': { width: '75%', color: 'bg-orange-500', label: 'Advanced' },
    'Expert': { width: '100%', color: 'bg-green-500', label: 'Expert' }
  };
  return levels[proficiency] || levels['Intermediate'];
};

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [reviewSort, setReviewSort] = useState('date');
  const [reviewFilter, setReviewFilter] = useState('all');
  const reviewsPerPage = 10;
  const [reviewsPagination, setReviewsPagination] = useState(null);
  const [swapData, setSwapData] = useState({
    requestedSkill: { name: '', description: '' },
    offeredSkill: { name: '', description: '' },
    message: '',
    scheduledDate: ''
  });

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${id}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user profile');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchAllReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const params = new URLSearchParams({
        page: currentReviewPage,
        limit: reviewsPerPage,
        sort: reviewSort
      });
      const response = await axios.get(`/api/users/${id}/reviews?${params}`);
      setAllReviews(response.data.reviews);
      setReviewsPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [id, currentReviewPage, reviewSort, reviewsPerPage]);

  const openAllReviewsModal = async () => {
    setShowAllReviewsModal(true);
    setCurrentReviewPage(1);
    setReviewSort('date');
    setReviewFilter('all');
    await fetchAllReviews();
  };

  const closeAllReviewsModal = () => {
    setShowAllReviewsModal(false);
    setAllReviews([]);
    setReviewsPagination(null);
  };

  const handleReviewSortChange = async (newSort) => {
    setReviewSort(newSort);
    setCurrentReviewPage(1);
    await fetchAllReviews();
  };

  const handleReviewFilterChange = async (newFilter) => {
    setReviewFilter(newFilter);
    setCurrentReviewPage(1);
    await fetchAllReviews();
  };

  const filteredReviews = allReviews.filter(review => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === '5star') return review.rating === 5;
    if (reviewFilter === '4star') return review.rating === 4;
    if (reviewFilter === '3star') return review.rating === 3;
    if (reviewFilter === '2star') return review.rating === 2;
    if (reviewFilter === '1star') return review.rating === 1;
    if (reviewFilter === 'withComments') return review.comment && review.comment.trim().length > 0;
    return true;
  });

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSwapRequest = async () => {
    if (!swapData.requestedSkill.name || !swapData.offeredSkill.name) {
      toast.error('Please enter both skills');
      return;
    }
    
    try {
      await API.post("/swaps", {
        recipientId: user._id,
        ...swapData,
      });
      
      toast.success("Swap Request Sent Successfully!");
      setShowSwapModal(false);
      setSwapData({
        requestedSkill: { name: "", description: "" },
        offeredSkill: { name: "", description: "" },
        message: "",
        scheduledDate: "",
      });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Swap request failed");
    }
  };

  // Get verification badge
  const getVerificationBadge = (score, badge) => {
    if (badge) return badge;
    if (score >= 80) return '🏆 Gold Verified';
    if (score >= 50) return '🥈 Silver Verified';
    if (score >= 25) return '🥉 Bronze Verified';
    return null;
  };

  const getBadgeColorClass = (score) => {
    if (score >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score >= 50) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (score >= 25) return 'bg-orange-100 text-orange-800 border-orange-300';
    return '';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const getAvailabilityText = (availability) => {
    if (!availability) return 'Not specified';
    const options = [];
    
    if (availability.weekdays) options.push('Weekdays');
    if (availability.weekends) options.push('Weekends');
    if (availability.evenings) options.push('Evenings');
    if (availability.mornings) options.push('Mornings');
    
    return options.length > 0 ? options.join(', ') : 'Not specified';
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">User not found</p>
      </div>
    );
  }

  const isOwner = currentUser?._id === user._id;
  const verificationBadge = getVerificationBadge(user.verificationScore || 0, user.verificationBadge);
  const githubVerifiedSkillsCount = (user.skillsOffered || []).filter(s => s.verified === true && s.verifiedVia === 'github').length;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white pt-8 px-2 animate-fade-in">
      {/* Header */}
      <div className="mb-8 w-full max-w-4xl">
        <button
          onClick={() => navigate('/browse')}
          className="flex items-center text-brand-mauve hover:text-brand-plum mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Browse
        </button>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              {user?.profilePhoto ? (
                <div className="relative">
                  <img
                    src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-brand-mauve shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7B466A&color=fff&size=96`;
                    }}
                  />
                  {user.githubConnected && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border-2 border-white">
                      <Github className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#7B466A] to-[#5D3C64] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-brand-mauve">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  {user.githubConnected && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border-2 border-white">
                      <Github className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                {verificationBadge && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColorClass(user.verificationScore)}`}>
                    <Award className="w-3 h-3" />
                    {verificationBadge}
                  </span>
                )}
                {user.githubConnected && !verificationBadge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                    <Github className="w-3 h-3" />
                    GitHub Connected
                  </span>
                )}
              </div>

              {user.location && (
                <p className="text-gray-600 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {user.location}
                </p>
              )}
            </div>
          </div>
          
          {/* Rating and Swap Button - Only show swap button if not owner */}
          <div className="flex flex-col items-end gap-3">
            {typeof user.ratingAverage === 'number' && user.ratingCount > 0 ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  {renderStars(user.ratingAverage)}
                  <span className="ml-2 font-bold text-[#7B466A]">{user.ratingAverage.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({user.ratingCount})</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No ratings yet</span>
            )}
            
            {currentUser && !isOwner && (
              <button
                onClick={() => setShowSwapModal(true)}
                className="btn btn-primary mt-2 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Request Swap
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Stats Section - Only show if user has GitHub connected */}
      {user.githubConnected && user.githubStats && (
        <div className="card mb-8 w-full max-w-4xl bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 text-gray-700" />
              <div>
                <h3 className="font-semibold text-gray-800">GitHub Verified</h3>
                <a 
                  href={user.githubProfile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-brand-plum hover:underline"
                >
                  @{user.githubUsername}
                </a>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{user.githubStats.publicRepos || 0}</p>
                <p className="text-xs text-gray-500">Repos</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{user.githubStats.followers || 0}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-brand-plum">{user.verificationScore || 0}</p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            </div>
          </div>
          {user.verificationScore > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-brand-plum h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(user.verificationScore, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div className="card mb-8 w-full max-w-4xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700">{user.bio}</p>
        </div>
      )}

      {/* Availability */}
      <div className="card mb-8 w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Availability</h2>
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{getAvailabilityText(user.availability)}</span>
        </div>
      </div>

      {/* Skills Offered */}
      <div className="card mb-8 w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Skills Offered
          {githubVerifiedSkillsCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {githubVerifiedSkillsCount} GitHub Verified
            </span>
          )}
        </h2>
        {user.skillsOffered?.length === 0 ? (
          <p className="text-gray-500">No skills offered yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {user.skillsOffered?.map((skill, index) => {
              const profStyle = getProficiencyStyle(skill.proficiency);
              return (
                <div key={skill._id || index} className={`p-4 rounded-lg border ${
                  skill.verified 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${skill.verified ? 'text-green-800' : 'text-gray-800'}`}>
                      {skill.name}
                    </h3>
                    {skill.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {skill.description && (
                    <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                  )}
                  {/* Visual proficiency bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Proficiency</span>
                      <span>{profStyle.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${profStyle.color} h-2.5 rounded-full transition-all duration-300`}
                        style={{ width: profStyle.width }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills Wanted */}
      <div className="card mb-8 w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Wanted</h2>
        {user.skillsWanted?.length === 0 ? (
          <p className="text-gray-500">No skills wanted yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {user.skillsWanted?.map((skill, index) => (
              <div key={skill._id || index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800">{skill.name}</h3>
                {skill.description && (
                  <p className="text-sm text-blue-600 mt-1">{skill.description}</p>
                )}
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                  {skill.priority} Priority
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Request Skill Swap with {user.name}</h3>
              <button onClick={() => setShowSwapModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill You Want to Learn
                </label>
                <input
                  type="text"
                  value={swapData.requestedSkill.name}
                  onChange={(e) => setSwapData({
                    ...swapData,
                    requestedSkill: { ...swapData.requestedSkill, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Guitar"
                />
                <textarea
                  value={swapData.requestedSkill.description}
                  onChange={(e) => setSwapData({
                    ...swapData,
                    requestedSkill: { ...swapData.requestedSkill, description: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  placeholder="Describe what you want to learn..."
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill You Can Offer
                </label>
                <input
                  type="text"
                  value={swapData.offeredSkill.name}
                  onChange={(e) => setSwapData({
                    ...swapData,
                    offeredSkill: { ...swapData.offeredSkill, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Spanish"
                />
                <textarea
                  value={swapData.offeredSkill.description}
                  onChange={(e) => setSwapData({
                    ...swapData,
                    offeredSkill: { ...swapData.offeredSkill, description: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                  placeholder="Describe what you can teach..."
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={swapData.message}
                  onChange={(e) => setSwapData({ ...swapData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal message..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={swapData.scheduledDate}
                  onChange={(e) => setSwapData({ ...swapData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSwapModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSwapRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Reviews Modal */}
      {showAllReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-brand-plum">All Reviews for {user.name}</h2>
              <button
                onClick={closeAllReviewsModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort by:</label>
                  <select
                    value={reviewSort}
                    onChange={(e) => handleReviewSortChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="date">Date (Newest)</option>
                    <option value="rating">Rating (Highest)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter:</label>
                  <select
                    value={reviewFilter}
                    onChange={(e) => handleReviewFilterChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Reviews</option>
                    <option value="5star">5 Stars</option>
                    <option value="4star">4 Stars</option>
                    <option value="3star">3 Stars</option>
                    <option value="2star">2 Stars</option>
                    <option value="1star">1 Star</option>
                    <option value="withComments">With Comments</option>
                  </select>
                </div>
                {reviewsPagination && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredReviews.length} of {reviewsPagination.totalReviews} reviews
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="md" />
                  <p className="mt-2 text-gray-600">Loading reviews...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredReviews.map((review, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          {review.reviewer && review.reviewer.profilePhoto ? (
                            <img src={review.reviewer.profilePhoto} alt={review.reviewer.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-700">
                              {review.reviewer && review.reviewer.name ? review.reviewer.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-brand-plum">{review.reviewer && review.reviewer.name}</span>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <div className="text-gray-700 italic">"{review.comment}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {reviewsPagination && reviewsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentReviewPage(p => Math.max(1, p - 1))}
                        disabled={!reviewsPagination.hasPrevPage}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {reviewsPagination.currentPage} of {reviewsPagination.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentReviewPage(p => Math.min(reviewsPagination.totalPages, p + 1))}
                        disabled={!reviewsPagination.hasNextPage}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;