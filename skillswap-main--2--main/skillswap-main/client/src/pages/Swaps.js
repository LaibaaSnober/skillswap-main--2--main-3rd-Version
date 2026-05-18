import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from "../config/api";
import toast from 'react-hot-toast';
import {
  Clock,
  Check,
  X,
  Star,
  MessageSquare,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const Swaps = () => {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { user: currentUser } = useAuth();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSwap, setRatingSwap] = useState(null);
  const [ratingData, setRatingData] = useState({
    rating: 5,
    comment: ''
  });
  const [ratingLoading, setRatingLoading] = useState(false);

  // FETCH SWAPS
  const fetchSwaps = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const response = await api.get(`/swaps/my-swaps${params}`);
      setSwaps(response.data);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      toast.error('Failed to load swaps');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSwaps();
    toast.success('Swaps refreshed');
  };

  useEffect(() => {
    fetchSwaps();
    // Listen for refresh-swaps event
    const handleRefreshEvent = () => fetchSwaps();
    window.addEventListener('refresh-swaps', handleRefreshEvent);
    return () => window.removeEventListener('refresh-swaps', handleRefreshEvent);
  }, [fetchSwaps]);

  // ACCEPT SWAP
  const handleAccept = useCallback(async (swapId) => {
    try {
      await api.put(`/swaps/${swapId}/accept`);
      toast.success('Swap request accepted!');
      fetchSwaps();
    } catch (error) {
      console.error('Error accepting swap:', error);
      toast.error(error.response?.data?.message || 'Failed to accept swap request');
    }
  }, [fetchSwaps]);

  // REJECT SWAP
  const handleReject = useCallback(async (swapId) => {
    if (!window.confirm('Are you sure you want to reject this swap request?')) return;
    try {
      await api.put(`/swaps/${swapId}/reject`);
      toast.success('Swap request rejected');
      fetchSwaps();
    } catch (error) {
      console.error('Error rejecting swap:', error);
      toast.error(error.response?.data?.message || 'Failed to reject swap request');
    }
  }, [fetchSwaps]);

  // COMPLETE SWAP
  const handleComplete = useCallback(async (swapId) => {
    if (!window.confirm('Have you completed the skill swap? Marking as completed will allow both parties to rate each other.')) return;
    try {
      await api.put(`/swaps/${swapId}/complete`);
      toast.success('Swap marked as completed! Both parties can now leave ratings.');
      fetchSwaps();
    } catch (error) {
      console.error('Error completing swap:', error);
      toast.error(error.response?.data?.message || 'Failed to complete swap');
    }
  }, [fetchSwaps]);

  // CANCEL SWAP
  const handleCancel = useCallback(async (swapId) => {
    if (!window.confirm('Are you sure you want to cancel this swap request?')) return;
    try {
      await api.put(`/swaps/${swapId}/cancel`);
      toast.success('Swap request cancelled');
      fetchSwaps();
    } catch (error) {
      console.error('Error cancelling swap:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel swap request');
    }
  }, [fetchSwaps]);

  // OPEN RATING MODAL
  const openRatingModal = (swap) => {
    setRatingSwap(swap);
    setRatingData({ rating: 5, comment: '' });
    setShowRatingModal(true);
  };

  // CLOSE RATING MODAL
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingSwap(null);
    setRatingData({ rating: 5, comment: '' });
  };

  // SUBMIT RATING
  const handleSubmitRating = async () => {
    if (!ratingData.rating) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      setRatingLoading(true);
      await api.post(`/swaps/${ratingSwap._id}/rate`, ratingData);
      toast.success('Rating submitted successfully!');
      closeRatingModal();
      fetchSwaps();
      // Refresh user profiles to show updated ratings
      window.dispatchEvent(new Event('refresh-users'));
    } catch (error) {
      console.error('Rating error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  // GET STATUS CONFIGURATION
  const getStatusConfig = (status) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <ClockIcon className="w-4 h-4" />,
        text: 'Pending'
      },
      accepted: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Accepted'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <XCircle className="w-4 h-4" />,
        text: 'Rejected'
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Completed'
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-600 border-gray-300',
        icon: <XCircle className="w-4 h-4" />,
        text: 'Cancelled'
      }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // RENDER STARS
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

  // GET USER ROLE IN SWAP
  const getUserRole = (swap) => {
    if (swap.requester._id === currentUser?._id) return 'requester';
    if (swap.recipient._id === currentUser?._id) return 'recipient';
    return null;
  };

  // CHECK IF USER CAN RATE
  const canRate = (swap) => {
    const role = getUserRole(swap);
    if (!role || swap.status !== 'completed') return false;
    if (role === 'requester') return !swap.requesterRating?.rating;
    return !swap.recipientRating?.rating;
  };

  // GET USER'S RATING
  const getUserRating = (swap) => {
    const role = getUserRole(swap);
    if (role === 'requester') return swap.requesterRating;
    if (role === 'recipient') return swap.recipientRating;
    return null;
  };

  // LOADING
  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  const stats = {
    total: swaps.length,
    pending: swaps.filter(s => s.status === 'pending').length,
    accepted: swaps.filter(s => s.status === 'accepted').length,
    completed: swaps.filter(s => s.status === 'completed').length
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-white pt-8 px-2 animate-fade-in">

      {/* HEADER */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between mb-8 mt-4 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-brand-plum mb-2 drop-shadow-lg">
            My Swaps
          </h1>
          <p className="text-lg text-brand-orchid">
            Track your skill swap requests and history
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orchid/20 text-brand-plum font-semibold hover:bg-brand-orchid/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
          <p className="text-sm text-purple-600">Total Swaps</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{stats.accepted}</p>
          <p className="text-sm text-blue-600">Accepted</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          <p className="text-sm text-green-600">Completed</p>
        </div>
      </div>

      {/* TABS */}
      <div className="w-full max-w-6xl flex flex-wrap gap-2 bg-[#F5F0F7] p-1 rounded-lg mb-10">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'pending', label: 'Pending', count: stats.pending },
          { key: 'accepted', label: 'Accepted', count: stats.accepted },
          { key: 'completed', label: 'Completed', count: stats.completed }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-6 rounded-lg text-md font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-white text-[#7B466A] shadow-md'
                : 'text-[#7B466A] hover:text-[#0C0420] hover:bg-white/50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key
                  ? 'bg-[#7B466A] text-white'
                  : 'bg-[#D391B0]/30 text-[#7B466A]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SWAPS LIST */}
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {swaps.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-[#5D3C64] text-xl font-semibold mb-2">
              No swaps found
            </p>
            <p className="text-[#9F6496] mb-4">
              {activeTab === 'all'
                ? "You haven't made any swap requests yet"
                : `No ${activeTab} swaps found`}
            </p>
            {activeTab === 'all' && (
              <Link
                to="/browse"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-[#7B466A] text-white font-bold shadow hover:bg-[#5D3C64] transition-colors text-lg"
              >
                Browse Skills
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        ) : (
          swaps.map((swap) => {
            const role = getUserRole(swap);
            const isRequester = role === 'requester';
            const isRecipient = role === 'recipient';
            const otherPerson = isRequester ? swap.recipient : swap.requester;
            const statusConfig = getStatusConfig(swap.status);
            const userRating = getUserRating(swap);
            const canUserRate = canRate(swap);
            
            return (
              <div
                key={swap._id}
                className="w-full bg-white rounded-2xl shadow-lg border-2 border-[#D391B0]/40 hover:border-[#D391B0] hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                  {/* LEFT - Person Info */}
                  <div className="flex flex-col items-center min-w-[120px]">
                    <Link to={`/user/${otherPerson?._id}`} className="group">
                      {otherPerson?.profilePhoto ? (
                        <img
                          src={otherPerson.profilePhoto.startsWith('http') ? otherPerson.profilePhoto : `http://localhost:5000${otherPerson.profilePhoto}`}
                          alt={otherPerson?.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-[#D391B0] group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPerson?.name || 'User')}&background=7B466A&color=fff`;
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7B466A] to-[#5D3C64] flex items-center justify-center text-white text-2xl font-bold border-4 border-[#D391B0] group-hover:scale-105 transition-transform">
                          {otherPerson?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </Link>
                    <div className="mt-2 font-semibold text-center">
                      <Link to={`/user/${otherPerson?._id}`} className="hover:text-[#7B466A]">
                        {otherPerson?.name}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500">
                      {isRequester ? 'You requested from them' : 'They requested from you'}
                    </div>
                  </div>

                  {/* CENTER - Swap Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.text}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatFullDate(swap.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-green-600 font-semibold mb-1">You're offering</p>
                        <p className="font-bold text-green-800">{swap.offeredSkill.name}</p>
                        {swap.offeredSkill.description && (
                          <p className="text-xs text-green-600 mt-1">{swap.offeredSkill.description}</p>
                        )}
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-blue-600 font-semibold mb-1">You're requesting</p>
                        <p className="font-bold text-blue-800">{swap.requestedSkill.name}</p>
                        {swap.requestedSkill.description && (
                          <p className="text-xs text-blue-600 mt-1">{swap.requestedSkill.description}</p>
                        )}
                      </div>
                    </div>

                    {swap.message && (
                      <div className="mt-3 p-3 bg-[#F5F0F7] rounded-lg flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-[#9F6496] mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-[#7B466A] break-words italic">
                          "{swap.message}"
                        </p>
                      </div>
                    )}

                    {swap.completedDate && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Completed on {formatFullDate(swap.completedDate)}
                      </div>
                    )}
                  </div>

                  {/* RIGHT - Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <Link
                      to={`/swaps/${swap._id}`}
                      className="px-5 py-2 rounded-lg bg-[#D391B0] text-[#0C0420] font-bold shadow hover:bg-[#BA6E8F] transition-colors text-center"
                    >
                      View Details
                    </Link>

                    {swap.status === 'pending' && (
                      <>
                        {isRecipient ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(swap._id)}
                              className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(swap._id)}
                              className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancel(swap._id)}
                            className="px-5 py-2 rounded-lg bg-red-100 text-red-700 font-bold border border-red-300 hover:bg-red-200 transition-colors"
                          >
                            Cancel Request
                          </button>
                        )}
                      </>
                    )}

                    {swap.status === 'accepted' && (
                      <button
                        onClick={() => handleComplete(swap._id)}
                        className="px-5 py-2 rounded-lg bg-[#7B466A] text-white font-bold hover:bg-[#5D3C64] transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}

                    {swap.status === 'completed' && (
                      <>
                        {userRating?.rating ? (
                          <div className="flex flex-col items-center gap-1 p-2 bg-yellow-50 rounded-lg">
                            <span className="text-xs text-gray-600">Your rating</span>
                            <div className="flex items-center gap-1">
                              {renderStars(userRating.rating)}
                              <span className="font-bold text-yellow-700">{userRating.rating.toFixed(1)}</span>
                            </div>
                            {userRating.comment && (
                              <p className="text-xs text-gray-500 text-center mt-1">"{userRating.comment.substring(0, 50)}"</p>
                            )}
                          </div>
                        ) : canUserRate ? (
                          <button
                            onClick={() => openRatingModal(swap)}
                            className="px-5 py-2 rounded-lg bg-[#7B466A] text-white font-bold hover:bg-[#5D3C64] transition-colors"
                          >
                            Rate Experience
                          </button>
                        ) : (
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Waiting for other party to complete the swap</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RATING MODAL - IMPROVED */}
      {showRatingModal && ratingSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-purple-700">Rate Your Swap Experience</h2>
                <button
                  onClick={closeRatingModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                How was your experience swapping with {ratingSwap.requester._id === currentUser?._id ? ratingSwap.recipient.name : ratingSwap.requester.name}?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">
                    Rating
                  </label>
                  <div className="flex gap-3 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingData({ ...ratingData, rating: star })}
                        className="focus:outline-none transform hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            ratingData.rating >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-gray-700">
                    Comment (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Share your experience to help others in the community..."
                    value={ratingData.comment}
                    onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {ratingData.comment.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmitRating}
                  disabled={ratingLoading}
                  className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  onClick={closeRatingModal}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Swaps;