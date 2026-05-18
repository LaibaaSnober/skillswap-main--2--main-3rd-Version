import React, { useEffect, useState } from "react";
import API from "../config/api";
import { Link } from "react-router-dom";
import { Github, CheckCircle, Star, MapPin, Award } from 'lucide-react';

// Helper to get proficiency color for visual indicator
const getProficiencyColor = (proficiency) => {
  switch (proficiency?.toLowerCase()) {
    case 'beginner': return 'bg-blue-400';
    case 'intermediate': return 'bg-yellow-500';
    case 'advanced': return 'bg-orange-500';
    case 'expert': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/users/all");
        // Sort by verification score (highest first)
        const sortedUsers = res.data.sort((a, b) => 
          (b.verificationScore || 0) - (a.verificationScore || 0)
        );
        setUsers(sortedUsers);
      } catch (error) {
        console.log("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Get badge based on verification score
  const getBadge = (score, badge) => {
    if (badge) return badge;
    if (score >= 80) return "🏆 Gold Verified";
    if (score >= 50) return "🥈 Silver Verified";
    if (score >= 25) return "🥉 Bronze Verified";
    return null;
  };

  // Get badge color
  const getBadgeColor = (score) => {
    if (score >= 80) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    if (score >= 50) return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    if (score >= 25) return "bg-orange-500/20 text-orange-600 border-orange-500/30";
    return "";
  };

  // Filter users by search term
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.verifiedSkills?.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B466A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-[#5D3C64] mb-2">Community Members</h1>
          <p className="text-lg text-[#7B466A]">Discover skilled professionals and connect with them</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg border border-[#7B466A]/30 focus:border-[#7B466A] focus:ring-2 focus:ring-[#7B466A]/20 outline-none bg-white text-[#0C0420] placeholder-[#7B466A]/50"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7B466A]/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#5D3C64] text-xl">No users found</p>
            <p className="text-[#9F6496] mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const badge = getBadge(user.verificationScore || 0, user.verificationBadge);
              const verifiedSkillsCount = (user.skillsOffered || []).filter(s => s.verified === true).length;
              
              return (
                <Link
                  key={user._id}
                  to={`/user/${user._id}`}
                  className="group bg-white rounded-2xl shadow-lg border-2 border-[#D391B0]/30 hover:border-[#D391B0] hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {user.profilePhoto ? (
                          <img
                            src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`}
                            alt={user.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#7B466A]"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7B466A&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B466A] to-[#5D3C64] flex items-center justify-center text-white text-2xl font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-[#0C0420] group-hover:text-[#7B466A] transition-colors">
                            {user.name}
                          </h3>
                          {user.location && (
                            <p className="text-sm text-[#9F6496] flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {user.location}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Verification Badge */}
                      {badge && (
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(user.verificationScore || 0)} flex items-center gap-1`}>
                          <Award className="w-3 h-3" />
                          {badge}
                        </div>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex justify-around py-3 mb-3 border-y border-[#D391B0]/20">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#5D3C64]">{user.reputation || 0}</p>
                        <p className="text-xs text-[#9F6496]">Reputation</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#5D3C64]">{user.swapsCompleted || 0}</p>
                        <p className="text-xs text-[#9F6496]">Swaps</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#5D3C64]">{user.verificationScore || 0}</p>
                        <p className="text-xs text-[#9F6496]">Verified Score</p>
                      </div>
                    </div>

                    {/* Verified Skills */}
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#5D3C64] mb-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Verified Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.verifiedSkills?.length > 0 ? (
                          user.verifiedSkills.slice(0, 4).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300 flex items-center gap-1"
                            >
                              {skill}
                              <CheckCircle className="w-3 h-3" />
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No verified skills yet</span>
                        )}
                        {user.verifiedSkills?.length > 4 && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            +{user.verifiedSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Offered Skills Preview with Proficiency Indicators */}
                    {user.skillsOffered?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-[#5D3C64] mb-2 flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Offers
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsOffered.slice(0, 3).map((skill, i) => (
                            <div
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                                skill.verified 
                                  ? 'bg-green-100 text-green-700 border-green-400' 
                                  : 'bg-purple-100 text-purple-700 border-purple-300'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full mr-0.5" style={{ backgroundColor: 'currentColor' }}></span>
                              {skill.name}
                              {skill.verified && <CheckCircle className="w-3 h-3 text-green-600 ml-0.5" />}
                              {/* Proficiency dot indicator */}
                              <span 
                                className={`ml-1 w-2 h-2 rounded-full ${getProficiencyColor(skill.proficiency)}`}
                                title={skill.proficiency || 'Intermediate'}
                              />
                            </div>
                          ))}
                          {user.skillsOffered.length > 3 && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              +{user.skillsOffered.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar for Verification Score */}
                    {user.verificationScore > 0 && (
                      <div className="mt-4">
                        <div className="w-full bg-[#D391B0]/20 rounded-full h-1.5">
                          <div
                            className="bg-[#7B466A] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(user.verificationScore || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* GitHub Connected Indicator */}
                    {user.githubConnected && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                        <Github className="w-3 h-3" />
                        GitHub Verified
                        {verifiedSkillsCount > 0 && (
                          <span className="ml-1">• {verifiedSkillsCount} verified skills</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <div className="px-6 py-3 bg-[#F8F6FA] border-t border-[#D391B0]/20">
                    <span className="text-sm font-semibold text-[#7B466A] group-hover:text-[#5D3C64] flex items-center justify-center gap-1">
                      View Profile
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {users.length > 0 && (
          <div className="mt-12 p-6 bg-gradient-to-r from-[#F8F6FA] to-[#F5F0F7] rounded-2xl border border-[#D391B0]/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-[#5D3C64]">{users.length}</p>
                <p className="text-sm text-[#9F6496]">Total Members</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#5D3C64]">
                  {users.filter(u => u.githubConnected).length}
                </p>
                <p className="text-sm text-[#9F6496]">GitHub Verified</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#5D3C64]">
                  {users.reduce((sum, u) => sum + (u.verificationScore || 0), 0)}
                </p>
                <p className="text-sm text-[#9F6496]">Total Score Points</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#5D3C64]">
                  {users.reduce((sum, u) => sum + (u.swapsCompleted || 0), 0)}
                </p>
                <p className="text-sm text-[#9F6496]">Total Swaps</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;