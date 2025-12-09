import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Sprout, Calendar, Image as ImageIcon, Share2, Home, X, Instagram, Award } from 'lucide-react';

const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadPublicProfile();
  }, [username]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/g/${username}`);
      setProfile(response.data);
    } catch (err) {
      console.error('Error loading public profile:', err);
      setError(err.response?.data?.error || 'Nie znaleziono profilu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} dni temu`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'miesiąc' : 'miesięcy'} temu`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'rok' : 'lat'} temu`;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'harvested':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'ready':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'soon':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'harvested':
        return '✅ Zebrano';
      case 'ready':
        return '🎉 Gotowe!';
      case 'soon':
        return '⏰ Wkrótce';
      case 'unknown':
        return '🌱 Rośnie';
      default:
        return '🌱 Rośnie';
    }
  };

  const getProgressColor = (percent, status) => {
    if (status === 'ready') return 'bg-green-500';
    if (status === 'soon') return 'bg-yellow-500';
    if (percent < 30) return 'bg-blue-400';
    if (percent < 70) return 'bg-emerald-400';
    return 'bg-green-400';
  };

  const formatDaysUntil = (days) => {
    if (days === null || days === undefined) return null;
    if (days <= 0) return 'Dzisiaj!';
    if (days === 1) return 'Jutro';
    if (days <= 7) return `Za ${days} dni`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `Za ${weeks} ${weeks === 1 ? 'tydzień' : 'tygodni'}`;
    }
    return `Za ${days} dni`;
  };

  const getBadgeColor = (tier) => {
    switch (tier) {
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-300 to-gray-500';
      case 'bronze':
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getBadgeBorder = (tier) => {
    switch (tier) {
      case 'gold':
        return 'border-yellow-300 dark:border-yellow-600';
      case 'silver':
        return 'border-gray-400 dark:border-gray-500';
      case 'bronze':
        return 'border-orange-300 dark:border-orange-500';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profil nie znaleziony
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Home size={18} />
            Wróć do strony głównej
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Cover Photo */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800">
        {profile.coverPhoto ? (
          <img
            src={`${process.env.REACT_APP_API_URL || ''}/${profile.coverPhoto.path}`}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sprout size={80} className="text-white opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  🌿 {username}
                </h1>
                {profile.bio && (
                  <p className="text-white/90 text-sm md:text-base max-w-2xl drop-shadow-md">
                    {profile.bio}
                  </p>
                )}
                {profile.memberSince && (
                  <p className="text-white/70 text-xs md:text-sm mt-2 drop-shadow-md">
                    Ogrodnik od {formatDate(profile.memberSince)}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex gap-2">
                {profile.socialInstagram && (
                  <a
                    href={profile.socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition"
                    title="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition"
                  title="Udostępnij profil"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        {profile.stats && (
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {profile.stats.plots}
              </div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                {profile.stats.plots === 1 ? 'Grządka' : 'Grządek'}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {profile.stats.plants}
              </div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                {profile.stats.plants === 1 ? 'Roślina' : 'Roślin'}
              </div>
            </div>
          </div>
        )}

        {/* Badges / Achievements */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Award size={24} className="text-yellow-600 dark:text-yellow-400" />
              Osiągnięcia
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative group bg-gradient-to-br ${getBadgeColor(badge.tier)} p-0.5 rounded-xl hover:scale-105 transition-transform duration-300`}
                  title={badge.description}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                      {badge.name}
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {badge.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {profile.gallery && profile.gallery.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ImageIcon size={24} className="text-green-600 dark:text-green-400" />
              Galeria
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {profile.gallery.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-square overflow-hidden rounded-lg hover:opacity-90 transition group"
                >
                  <img
                    src={`${process.env.REACT_APP_API_URL || ''}/${photo.path}`}
                    alt={photo.caption || photo.plantName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {(photo.plantName || photo.caption) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <p className="text-white text-xs p-2 line-clamp-2">
                        {photo.caption || photo.plantName}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline - What's Growing Now */}
        {profile.timeline && profile.timeline.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Calendar size={24} className="text-green-600 dark:text-green-400" />
              Co rośnie teraz
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.timeline.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="flex-shrink-0 w-32 h-32">
                      {item.imagePath ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL || ''}/${item.imagePath}`}
                          alt={item.plantName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                          <Sprout size={32} className="text-green-600 dark:text-green-400 opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                              {item.plantName}
                            </h3>
                            {item.plantVariety && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {item.plantVariety}
                              </p>
                            )}
                          </div>
                          <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {item.plotName} • Rząd {item.rowNumber}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      {item.progressPercent !== undefined && item.progressPercent !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {formatDaysUntil(item.daysUntilHarvest) ||
                               `${item.daysSincePlanted} dni od sadzenia`}
                            </span>
                            <span className="text-gray-900 dark:text-white font-bold">
                              {item.progressPercent}%
                            </span>
                          </div>
                          <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full ${getProgressColor(item.progressPercent, item.status)} transition-all duration-1000 ease-out rounded-full`}
                              style={{
                                width: `${item.progressPercent}%`,
                                animation: 'progressGrow 1.5s ease-out'
                              }}
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!profile.timeline || profile.timeline.length === 0) &&
         (!profile.gallery || profile.gallery.length === 0) &&
         !profile.stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Sprout size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ten ogród dopiero się rozwija
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Wkrótce pojawią się tutaj rośliny i zdjęcia!
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Udostępnione przez {username} za pomocą
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition"
          >
            <Sprout size={20} />
            GardenApp.pl
          </Link>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <X size={24} />
          </button>
          <div className="max-w-5xl w-full">
            <img
              src={`${process.env.REACT_APP_API_URL || ''}/${selectedPhoto.path}`}
              alt={selectedPhoto.caption || selectedPhoto.plantName}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {(selectedPhoto.caption || selectedPhoto.plantName) && (
              <div className="mt-4 text-center">
                <p className="text-white text-lg font-medium">
                  {selectedPhoto.caption || selectedPhoto.plantName}
                </p>
                {selectedPhoto.plotName && (
                  <p className="text-white/70 text-sm mt-1">
                    {selectedPhoto.plotName}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Udostępnij profil
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link do profilu:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition text-sm font-medium"
                  >
                    {copySuccess ? '✓ Skopiowano' : 'Kopiuj'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  💡 Dodaj ten link do swojego bio na Instagramie!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
