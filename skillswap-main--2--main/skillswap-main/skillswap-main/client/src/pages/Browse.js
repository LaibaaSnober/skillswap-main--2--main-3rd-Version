import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, MapPin, Clock, Filter, X, Github, Star, CheckCircle, Award } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { Link } from 'react-router-dom';

const Browse = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { user: currentUser } = useAuth();
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [mySkill, setMySkill] = useState('');
  const [theirSkill, setTheirSkill] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);
  const USERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and paginate users
  const filteredUsers = users.filter(user => user.isPublic === true);
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Sort by verification score (higher first) then by rating
    const scoreA = a.verificationScore || 0;
    const scoreB = b.verificationScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.ratingAverage || 0) - (a.ratingAverage || 0);
  });
  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.location) params.append('location', filters.location);
      if (filters.availability) params.append('availability', filters.availability);

      const response = await axios.get(`/api/users/browse?${params}`);
      console.log('Fetched users:', response.data.length);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
    // Listen for refresh-users event
    const handler = () => fetchUsers();
    window.addEventListener('refresh-users', handler);
    return () => window.removeEventListener('refresh-users', handler);
  }, [fetchUsers]);

  const handleSearch = () => {
    setCurrentPage(1);
    setFilters({
      skill: searchTerm,
      location,
      availability
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setAvailability('');
    setFilters({});
    setCurrentPage(1);
  };

  const getAvailabilityText = (user) => {
    const avail = user.availability;
    if (!avail) return 'Not specified';
    const options = [];
    
    if (avail.weekdays) options.push('Weekdays');
    if (avail.weekends) options.push('Weekends');
    if (avail.evenings) options.push('Evenings');
    if (avail.mornings) options.push('Mornings');
    
    return options.length > 0 ? options.join(', ') : 'Not specified';
  };

  const openSwapModal = (targetUser) => {
    setSwapTarget(targetUser);
    setMySkill('');
    setTheirSkill('');
    setSwapMessage('');
    setShowSwapModal(true);
  };

  const closeSwapModal = () => {
    setShowSwapModal(false);
    setSwapTarget(null);
  };

  const handleSendSwap = async () => {
    if (!mySkill || !theirSkill) {
      toast.error('Please select both skills');
      return;
    }
    
    setSwapLoading(true);
    try {
      // Find the full skill objects
      const mySkillObj = currentUser?.skillsOffered?.find(s => s.name === mySkill);
      const theirSkillObj = swapTarget?.skillsOffered?.find(s => s.name === theirSkill);
      
      const swapData = {
        recipientId: swapTarget._id,
        requestedSkill: {
          name: theirSkill,
          description: theirSkillObj?.description || ''
        },
        offeredSkill: {
          name: mySkill,
          description: mySkillObj?.description || ''
        },
        message: swapMessage
      };
      
      await api.post('/swaps', swapData);
      toast.success('Swap request sent successfully!');
      closeSwapModal();
      // Refresh swaps list if user navigates there
      window.dispatchEvent(new Event('refresh-swaps'));
    } catch (error) {
      console.error('Swap error:', error);
      toast.error(error.response?.data?.message || 'Failed to send swap request');
    } finally {
      setSwapLoading(false);
    }
  };

  // Get verification badge based on score
  const getVerificationBadge = (score, badge) => {
    if (badge) return { text: badge, color: 'bg-gradient-to-r' };
    if (score >= 80) return { text: '🏆 Gold Verified', color: 'bg-gradient-to-r from-yellow-500 to-yellow-600' };
    if (score >= 50) return { text: '🥈 Silver Verified', color: 'bg-gradient-to-r from-gray-400 to-gray-500' };
    if (score >= 25) return { text: '🥉 Bronze Verified', color: 'bg-gradient-to-r from-orange-500 to-orange-600' };
    return null;
  };

  // Get badge color class for text badges
  const getBadgeColorClass = (score) => {
    if (score >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score >= 50) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (score >= 25) return 'bg-orange-100 text-orange-800 border-orange-300';
    return '';
  };

  // Render stars function
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

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white pt-8 px-2 animate-fade-in">
      <div className="w-full max-w-6xl flex flex-col items-start mb-8 mt-4">
        <h1 className="text-4xl font-extrabold text-brand-plum mb-2 drop-shadow-lg">Browse Skills</h1>
        <p className="text-lg text-brand-orchid">Find people with verified skills and start learning today</p>
      </div>

      {/* Search and Filters */}
      <div className="w-full max-w-6xl mb-10 bg-white rounded-3xl shadow-card-lg border border-brand-plum/30 p-8 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-mauve w-5 h-5" />
              <input
                type="text"
                placeholder="Search for skills (e.g., Photoshop, JavaScript, Guitar)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-10 py-3 rounded-lg border border-brand-plum focus:ring-2 focus:ring-brand-orchid outline-none bg-white text-brand-plum placeholder-brand-mauve shadow"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-mauve text-white font-semibold shadow-card hover:bg-brand-orchid transition-colors lg:w-auto"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-plum text-white font-semibold shadow-card hover:bg-brand-mauve transition-colors lg:w-auto"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-brand-orchid">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-plum mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-mauve w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-10 py-2 rounded-lg border border-brand-plum focus:ring-2 focus:ring-brand-orchid outline-none bg-white text-brand-plum placeholder-brand-mauve shadow"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-plum mb-1">Availability</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-mauve w-4 h-4" />
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-10 py-2 rounded-lg border border-brand-plum focus:ring-2 focus:ring-brand-orchid outline-none bg-white text-brand-plum shadow"
                  >
                    <option value="">Any availability</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="evenings">Evenings</option>
                    <option value="mornings">Mornings</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="text-sm text-brand-plum hover:text-brand-orchid flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Cards */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        {sortedUsers.length === 0 ? (
          <div className="text-center py-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-brand-orchid text-lg">No users found</p>
          </div>
        ) : (
          paginatedUsers.map((user, idx) => {
            const verificationBadge = getVerificationBadge(user.verificationScore || 0, user.verificationBadge);
            const verifiedSkillsCount = (user.skillsOffered || []).filter(s => s.verified === true).length;
            const githubVerifiedSkills = (user.skillsOffered || []).filter(s => s.verified === true && s.verifiedVia === 'github');
            
            return (
              <div
                key={user._id}
                className="w-full bg-white rounded-2xl shadow-card-lg border border-brand-orchid/30 hover:border-brand-orchid hover:shadow-2xl transition-all duration-300 mx-auto group animate-slide-up overflow-hidden"
                style={{ animationDelay: `${0.15 + idx * 0.05}s` }}
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Left: Profile photo */}
                  <Link to={`/user/${user._id}`} className="flex-shrink-0 flex flex-col items-center justify-center">
                    {user.profilePhoto ? (
                      <div className="relative">
                        <img
                          src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`}
                          alt={user.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-brand-plum shadow-lg group-hover:scale-105 transition-transform duration-300"
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
                        <div className="w-24 h-24 bg-gradient-to-br from-brand-plum to-brand-mauve rounded-full flex items-center justify-center text-3xl text-white font-bold shadow-lg border-4 border-brand-plum group-hover:scale-105 transition-transform duration-300">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {user.githubConnected && (
                          <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border-2 border-white">
                            <Github className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                  
                  {/* Center: Info */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <Link to={`/user/${user._id}`} className="hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h2 className="text-2xl font-bold text-brand-pink">{user.name}</h2>
                        {verificationBadge && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${verificationBadge.color}`}>
                            <Award className="w-3 h-3" />
                            {verificationBadge.text}
                          </span>
                        )}
                        {user.githubConnected && !verificationBadge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                            <Github className="w-3 h-3" />
                            GitHub Connected
                          </span>
                        )}
                      </div>
                    </Link>
                    
                    {user.location && (
                      <div className="text-brand-orchid flex items-center text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{user.location}</span>
                      </div>
                    )}
                    
                    {/* Skills Section */}
                    <div className="mt-3 space-y-2">
                      {/* Skills Offered */}
                      <div>
                        <span className="text-sm font-semibold text-green-700">Skills Offered:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.skillsOffered && user.skillsOffered.length > 0 ? (
                            user.skillsOffered.slice(0, 4).map((skill, index) => (
                              <span key={index} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                                skill.verified 
                                  ? 'bg-green-100 text-green-700 border-green-400' 
                                  : 'bg-green-50 text-green-600 border-green-200'
                              }`}>
                                {skill.name}
                                {skill.verified && (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No skills offered yet</span>
                          )}
                          {user.skillsOffered?.length > 4 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              +{user.skillsOffered.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Skills Wanted */}
                      <div>
                        <span className="text-sm font-semibold text-blue-700">Skills Wanted:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.skillsWanted && user.skillsWanted.length > 0 ? (
                            user.skillsWanted.slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                                {skill.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No skills wanted yet</span>
                          )}
                          {user.skillsWanted?.length > 3 && (
                            <span className="text-xs text-blue-600">+{user.skillsWanted.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Availability & Verification Score */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-brand-orchid">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{getAvailabilityText(user)}</span>
                      </div>
                      
                      {user.verificationScore > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-brand-plum h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(user.verificationScore, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-brand-plum">{user.verificationScore}</span>
                        </div>
                      )}
                      
                      {githubVerifiedSkills.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>{githubVerifiedSkills.length} GitHub verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex flex-col items-end justify-between min-w-[180px] gap-3">
                    <Link
                      to={`/user/${user._id}`}
                      className="w-full px-6 py-2.5 rounded-lg bg-brand-orchid/10 text-brand-plum font-semibold border border-brand-orchid/30 hover:bg-brand-orchid hover:text-white hover:border-brand-orchid transition-all duration-200 text-center"
                    >
                      View Profile
                    </Link>
                    
                    {currentUser && user._id !== currentUser._id && (
                      <button
                        className="w-full px-6 py-2.5 rounded-lg bg-brand-plum text-white font-bold shadow-md hover:bg-brand-mauve hover:shadow-lg transition-all duration-200"
                        onClick={() => openSwapModal(user)}
                      >
                        Request Swap
                      </button>
                    )}
                    
                    {/* Rating */}
                    <div className="text-right mt-2">
                      {typeof user.ratingAverage === 'number' && user.ratingCount > 0 ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            {renderStars(user.ratingAverage)}
                            <span className="ml-1 font-bold text-brand-plum">{user.ratingAverage.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({user.ratingCount})</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No ratings yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Swap Modal */}
      {showSwapModal && swapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-plum">Request Swap with {swapTarget.name}</h2>
                <button
                  onClick={closeSwapModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={e => { e.preventDefault(); handleSendSwap(); }} className="space-y-4">
                <div>
                  <label className="block text-brand-plum font-semibold mb-2">
                    Choose one of your offered skills
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-orchid focus:ring-2 focus:ring-brand-pink outline-none bg-white"
                    value={mySkill}
                    onChange={e => setMySkill(e.target.value)}
                    required
                  >
                    <option value="">Select a skill</option>
                    {currentUser?.skillsOffered?.map(skill => (
                      <option key={skill.name} value={skill.name}>
                        {skill.name} {skill.verified && '✓ (Verified)'}
                      </option>
                    ))}
                  </select>
                  {(!currentUser?.skillsOffered || currentUser.skillsOffered.length === 0) && (
                    <p className="text-xs text-red-500 mt-1">
                      You need to add skills to your profile first.
                      <Link to="/profile" className="text-brand-plum ml-1 underline">Add skills</Link>
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-brand-orchid font-semibold mb-2">
                    Choose one of their offered skills
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-orchid focus:ring-2 focus:ring-brand-pink outline-none bg-white"
                    value={theirSkill}
                    onChange={e => setTheirSkill(e.target.value)}
                    required
                  >
                    <option value="">Select a skill</option>
                    {swapTarget.skillsOffered?.map(skill => (
                      <option key={skill.name} value={skill.name}>
                        {skill.name} {skill.verified && '✓ (GitHub Verified)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-brand-plum font-semibold mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-orchid focus:ring-2 focus:ring-brand-pink outline-none bg-white resize-none"
                    value={swapMessage}
                    onChange={e => setSwapMessage(e.target.value)}
                    rows={3}
                    placeholder={`Hi! I noticed you offer ${theirSkill || 'skills'}. I'd love to learn from you and I can teach you ${mySkill || 'my skills'} in return!`}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={swapLoading || !mySkill || !theirSkill}
                    className="flex-1 bg-brand-plum text-white font-bold px-6 py-2.5 rounded-lg shadow hover:bg-brand-mauve transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {swapLoading ? 'Sending...' : 'Send Request'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 text-brand-plum font-bold px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-200 transition-all"
                    onClick={closeSwapModal}
                    disabled={swapLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full max-w-6xl flex justify-center mt-10">
          <nav className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-brand-orchid/20 text-brand-plum font-semibold hover:bg-brand-orchid hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                if (pageNum && pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      className={`min-w-[40px] h-10 rounded-lg font-semibold transition-all ${
                        pageNum === currentPage
                          ? 'bg-brand-orchid text-white shadow-md'
                          : 'border border-brand-orchid/50 text-brand-plum hover:bg-brand-orchid/20'
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
            </div>
            
            <button
              className="px-4 py-2 rounded-lg bg-brand-orchid/20 text-brand-plum font-semibold hover:bg-brand-orchid hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Browse;