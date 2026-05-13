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
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const Swaps = () => {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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

      const params =
        activeTab !== 'all' ? `?status=${activeTab}` : '';

      const response = await api.get(
        `/swaps/my-swaps${params}`
      );

      setSwaps(response.data);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      toast.error('Failed to load swaps');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSwaps();
  }, [fetchSwaps]);

  // ACCEPT SWAP
  const handleAccept = useCallback(
    async (swapId) => {
      try {
        await api.put(`/swaps/${swapId}/accept`);

        toast.success('Swap request accepted!');

        fetchSwaps();
      } catch (error) {
        console.error('Error accepting swap:', error);

        toast.error('Failed to accept swap request');
      }
    },
    [fetchSwaps]
  );

  // REJECT SWAP
  const handleReject = useCallback(
    async (swapId) => {
      try {
        await api.put(`/swaps/${swapId}/reject`);

        toast.success('Swap request rejected');

        fetchSwaps();
      } catch (error) {
        console.error('Error rejecting swap:', error);

        toast.error('Failed to reject swap request');
      }
    },
    [fetchSwaps]
  );

  // COMPLETE SWAP
  const handleComplete = useCallback(
    async (swapId) => {
      try {
        await api.put(`/swaps/${swapId}/complete`);

        toast.success('Swap marked as completed!');

        fetchSwaps();
      } catch (error) {
        console.error('Error completing swap:', error);

        toast.error('Failed to complete swap');
      }
    },
    [fetchSwaps]
  );

  // CANCEL SWAP
  const handleCancel = useCallback(
    async (swapId) => {
      try {
        await api.put(`/swaps/${swapId}/cancel`);

        toast.success('Swap request cancelled');

        fetchSwaps();
      } catch (error) {
        console.error('Error cancelling swap:', error);

        toast.error('Failed to cancel swap request');
      }
    },
    [fetchSwaps]
  );

  // OPEN RATING MODAL
  const openRatingModal = (swap) => {
    setRatingSwap(swap);

    setRatingData({
      rating: 5,
      comment: ''
    });

    setShowRatingModal(true);
  };

  // CLOSE RATING MODAL
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingSwap(null);
  };

  // SUBMIT RATING
  const handleSubmitRating = async () => {
    try {
      setRatingLoading(true);

      await api.post(
        `/swaps/${ratingSwap._id}/rate`,
        ratingData
      );

      toast.success('Rating submitted successfully!');

      closeRatingModal();

      fetchSwaps();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to submit rating'
      );
    } finally {
      setRatingLoading(false);
    }
  };

  // STATUS BADGE
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: 'badge-warning',
        text: 'Pending'
      },

      accepted: {
        color: 'badge-success',
        text: 'Accepted'
      },

      rejected: {
        color: 'badge-danger',
        text: 'Rejected'
      },

      completed: {
        color: 'badge-primary',
        text: 'Completed'
      },

      cancelled: {
        color: 'badge-secondary',
        text: 'Cancelled'
      }
    };

    const config = statusConfig[status] || {
      color: 'badge-secondary',
      text: status
    };

    return (
      <span className={`badge ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  };

  // RENDER STARS
  const renderStars = (rating) => {
    const stars = [];

    const fullStars = Math.floor(rating);

    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={i}
          className="w-4 h-4 fill-yellow-400 text-yellow-400"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300"
        />
      );
    }

    return stars;
  };

  // LOADING
  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        className="py-20"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white pt-8 px-2 animate-fade-in">

      {/* HEADER */}
      <div className="w-full max-w-6xl flex flex-col items-start mb-8 mt-4">
        <h1 className="text-4xl font-extrabold text-brand-plum mb-2 drop-shadow-lg">
          My Swaps
        </h1>

        <p className="text-lg text-brand-orchid">
          Track your skill swap requests and history
        </p>
      </div>

      {/* TABS */}
      <div className="w-full max-w-6xl flex space-x-1 bg-[#F5F0F7] p-1 rounded-lg mb-10">

        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'completed', label: 'Completed' }
        ].map((tab) => (

          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-6 rounded-lg text-md font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-[#7B466A] shadow'
                : 'text-[#7B466A] hover:text-[#0C0420]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SWAPS LIST */}
      <div className="w-full max-w-6xl flex flex-col gap-8">

        {swaps.length === 0 ? (

          <div className="text-center py-16">

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
                className="px-6 py-3 rounded-lg bg-[#7B466A] text-white font-bold shadow hover:bg-[#5D3C64] transition-colors text-lg inline-flex items-center"
              >
                Browse Skills

                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>

        ) : (

          swaps.map((swap) => (

            <div
              key={swap._id}
              className="w-full bg-white rounded-2xl shadow-lg border-2 border-[#D391B0] p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-2xl transition-shadow"
            >

              {/* LEFT */}
              <div className="flex flex-col items-center min-w-[110px]">

                <div className="w-20 h-20 rounded-full bg-[#7B466A] flex items-center justify-center text-white">
                  <User className="w-10 h-10" />
                </div>

                <div className="mt-2 font-semibold text-center">
                  {swap.requester._id === currentUser._id
                    ? 'You'
                    : swap.requester.name}
                </div>

                <div className="text-xs text-gray-500">
                  Requester
                </div>
              </div>

              {/* CENTER */}
              <div className="flex-1">

                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bold text-lg capitalize">
                    {swap.status}
                  </span>

                  {getStatusBadge(swap.status)}
                </div>

                <div className="flex flex-wrap gap-4 mb-3">

                  <div>
                    <span className="font-semibold text-green-700">
                      You're offering:
                    </span>

                    <div className="mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300 inline-block">
                      {swap.offeredSkill.name}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-blue-700">
                      You're requesting:
                    </span>

                    <div className="mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 inline-block">
                      {swap.requestedSkill.name}
                    </div>
                  </div>
                </div>

                {swap.message && (
                  <div className="mt-2 p-3 bg-[#F5F0F7] rounded-lg flex items-start gap-2">

                    <MessageSquare className="w-4 h-4 text-[#9F6496] mt-0.5" />

                    <p className="text-sm text-[#7B466A] break-words">
                      {swap.message}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-6 mt-4 text-sm text-[#5D3C64]">

                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {formatDate(swap.createdAt)}
                  </div>

                  {swap.scheduledDate && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Scheduled {formatDate(swap.scheduledDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-3 min-w-[160px]">

                <Link
                  to={`/swaps/${swap._id}`}
                  className="px-5 py-2 rounded-lg bg-[#D391B0] text-[#0C0420] font-bold shadow hover:bg-[#BA6E8F] transition-colors text-center"
                >
                  View Details
                </Link>

                {swap.status === 'pending' && (

                  <>
                    {swap.recipient._id === currentUser._id ? (

                      <div className="flex gap-2">

                        <button
                          onClick={() => handleAccept(swap._id)}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Accept
                        </button>

                        <button
                          onClick={() => handleReject(swap._id)}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                        >
                          <X className="w-4 h-4 inline mr-1" />
                          Reject
                        </button>
                      </div>

                    ) : (

                      <button
                        onClick={() => handleCancel(swap._id)}
                        className="px-5 py-2 rounded-lg bg-[#F5C6CB] text-[#A94442] font-bold border border-[#F1948A]"
                      >
                        Withdraw
                      </button>
                    )}
                  </>
                )}

                {swap.status === 'accepted' && (

                  <button
                    onClick={() => handleComplete(swap._id)}
                    className="px-5 py-2 rounded-lg bg-[#7B466A] text-white font-bold"
                  >
                    Mark as Completed
                  </button>
                )}

                {swap.status === 'completed' && (

                  <>
                    {((swap.requester._id === currentUser._id &&
                      swap.requesterRating?.rating) ||

                      (swap.recipient._id === currentUser._id &&
                        swap.recipientRating?.rating)) ? (

                      <div className="flex flex-col items-end gap-1">

                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-bold text-sm shadow">

                          {renderStars(
                            swap.requester._id === currentUser._id
                              ? swap.requesterRating.rating
                              : swap.recipientRating.rating
                          )}

                          <span className="ml-2">
                            {swap.requester._id === currentUser._id
                              ? swap.requesterRating.rating.toFixed(1)
                              : swap.recipientRating.rating.toFixed(1)}
                            /5
                          </span>
                        </span>
                      </div>

                    ) : (

                      <button
                        onClick={() => openRatingModal(swap)}
                        className="px-5 py-2 rounded-lg bg-[#7B466A] text-white font-bold"
                      >
                        Leave Rating
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* RATING MODAL */}
      {showRatingModal && ratingSwap && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

            <h2 className="text-xl font-bold text-purple-700 mb-4">
              Rate Your Swap
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitRating();
              }}
              className="space-y-4"
            >

              <div>
                <label className="block font-semibold mb-2">
                  Rating
                </label>

                <div className="flex gap-2">

                  {[1, 2, 3, 4, 5].map((star) => (

                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRatingData({
                          ...ratingData,
                          rating: star
                        })
                      }
                      className={`w-8 h-8 rounded-full ${
                        ratingData.rating >= star
                          ? 'bg-yellow-400 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div>

                <label className="block font-semibold mb-2">
                  Comment
                </label>

                <textarea
                  rows={3}
                  placeholder="Share your experience..."
                  value={ratingData.comment}
                  onChange={(e) =>
                    setRatingData({
                      ...ratingData,
                      comment: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div className="flex gap-4">

                <button
                  type="submit"
                  disabled={ratingLoading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold"
                >
                  {ratingLoading
                    ? 'Submitting...'
                    : 'Submit'}
                </button>

                <button
                  type="button"
                  onClick={closeRatingModal}
                  className="border border-gray-300 px-6 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Swaps;