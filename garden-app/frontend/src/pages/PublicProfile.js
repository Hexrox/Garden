import React, { useState, useEffect, useCallback } from 'react';
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

  const loadPublicProfile = useCallback(async () => {
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
  }, [username]);

  useEffect(() => {
    loadPublicProfile();
  }, [loadPublicProfile]);

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
      {/* Hero Section - Glass Card with Avatar (Variant A) */}
      <div className="relative min-h-[450px] md:min-h-[600px] bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 overflow-hidden">
        {/* Cover Photo Background */}
        {profile.coverPhoto ? (
          <>
            <img
              src={`${process.env.REACT_APP_API_URL || ''}/${profile.coverPhoto.path}`}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sprout size={80} className="text-white opacity-20" />
          </div>
        )}

        {/* Glass Card Container */}
        <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-8">
          <div className="max-w-4xl w-full">
            {/* Glass Morphism Card */}
            <div className="backdrop-blur-md bg-white/10 dark:bg-black/20 rounded-2xl md:rounded-3xl p-6 md:p-10 border border-white/20 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.profilePhoto ? (
                    <img
                      src={`${process.env.REACT_APP_API_URL || ''}/${profile.profilePhoto}`}
                      alt={username}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/30 shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/30 shadow-xl bg-white/20 flex items-center justify-center">
                      <Sprout size={40} className="text-white/70" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
                    {profile.displayName || username}
                  </h1>

                  {profile.bio && (
                    <p className="text-white/95 text-base md:text-lg max-w-2xl mb-4 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats Badges Inline */}
                  {profile.stats && (
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                      <div className="backdrop-blur-sm bg-white/20 border border-white/30 px-4 py-2 rounded-full flex items-center gap-2">
                        <Sprout size={18} className="text-white" />
                        <span className="text-white font-semibold text-sm">{profile.stats.plots} grządek</span>
                      </div>
                      <div className="backdrop-blur-sm bg-white/20 border border-white/30 px-4 py-2 rounded-full flex items-center gap-2">
                        <Calendar size={18} className="text-white" />
                        <span className="text-white font-semibold text-sm">{profile.stats.plants} roślin</span>
                      </div>
                      {profile.stats.harvests > 0 && (
                        <div className="backdrop-blur-sm bg-white/20 border border-white/30 px-4 py-2 rounded-full flex items-center gap-2">
                          <span className="text-white text-lg">🌾</span>
                          <span className="text-white font-semibold text-sm">{profile.stats.harvests} zbiorów</span>
                        </div>
                      )}
                    </div>
                  )}

                  {profile.memberSince && (
                    <p className="text-white/80 text-sm mb-4">
                      🌱 Ogrodnik od {formatDate(profile.memberSince)}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    {profile.socialInstagram && (
                      <a
                        href={profile.socialInstagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Zobacz na Instagramie"
                        className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Instagram"
                      >
                        <Instagram size={20} />
                      </a>
                    )}
                    <button
                      onClick={handleShare}
                      aria-label="Udostępnij profil"
                      className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Udostępnij profil"
                    >
                      <Share2 size={20} />
                    </button>
                    <Link
                      to="/"
                      aria-label="Wróć do strony głównej"
                      className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Strona główna"
                    >
                      <Home size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards - Removed, now in Hero for better mobile UX */}

        {/* Badges / Achievements - Mobile Optimized */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Award size={20} className="text-yellow-600 dark:text-yellow-400 md:w-6 md:h-6" />
              Osiągnięcia
            </h2>
            <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative group bg-gradient-to-br ${getBadgeColor(badge.tier)} p-0.5 rounded-xl hover:scale-105 active:scale-95 transition-transform duration-300 touch-manipulation`}
                  title={badge.description}
                  role="button"
                  tabIndex={0}
                  aria-label={`${badge.name}: ${badge.description}`}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 h-full flex flex-col items-center justify-center text-center min-h-[80px]">
                    <div className="text-3xl md:text-4xl mb-1 md:mb-2">{badge.icon}</div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                      {badge.name}
                    </div>
                    {/* Tooltip on hover - Desktop only */}
                    <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-[200px] text-center z-10">
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

        {/* Recent Harvests - Showcase with Photos & Notes */}
        {profile.harvests && profile.harvests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              Ostatnie zbiory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.harvests.map((harvest) => (
                <article
                  key={harvest.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Harvest Photo */}
                  {harvest.harvestPhoto && (
                    <div className="relative h-48">
                      <img
                        src={`${process.env.REACT_APP_API_URL || ''}/${harvest.harvestPhoto}`}
                        alt={`Zbiór ${harvest.plantName}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        🌾 Zebrano
                      </div>
                    </div>
                  )}

                  {/* Harvest Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          {harvest.plantName}
                        </h3>
                        {harvest.plantVariety && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {harvest.plantVariety}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {new Date(harvest.harvestDate).toLocaleDateString('pl-PL', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    {/* Harvest Notes */}
                    {harvest.harvestNotes && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 italic">
                        "{harvest.harvestNotes}"
                      </p>
                    )}

                    {/* Yield & Location */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      {harvest.yieldAmount && (
                        <span className="flex items-center gap-1">
                          ⚖️ {harvest.yieldAmount} {harvest.yieldUnit}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        📍 {harvest.plotName} • Rz. {harvest.rowNumber}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery - Mobile Optimized */}
        {profile.gallery && profile.gallery.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <ImageIcon size={20} className="text-green-600 dark:text-green-400 md:w-6 md:h-6" />
              Galeria
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {profile.gallery.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  aria-label={`Zobacz zdjęcie: ${photo.caption || photo.plantName}`}
                  className="relative aspect-square overflow-hidden rounded-lg hover:opacity-90 active:opacity-75 transition group touch-manipulation"
                >
                  <img
                    src={`${process.env.REACT_APP_API_URL || ''}/${photo.path}`}
                    alt={photo.caption || photo.plantName}
                    loading="lazy"
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

        {/* Timeline - What's Growing Now - Mobile Optimized */}
        {profile.timeline && profile.timeline.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-green-600 dark:text-green-400 md:w-6 md:h-6" />
              Co rośnie teraz
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {profile.timeline.map((item) => (
                <article
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg active:shadow-md transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02]"
                >
                  <div className="flex">
                    {/* Image - Responsive size */}
                    <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                      {item.imagePath ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL || ''}/${item.imagePath}`}
                          alt={`${item.plantName} ${item.plantVariety || ''}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                          <Sprout size={28} className="text-green-600 dark:text-green-400 opacity-50 md:w-8 md:h-8" />
                        </div>
                      )}
                    </div>

                    {/* Content - Better spacing on mobile */}
                    <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base leading-tight truncate">
                              {item.plantName}
                            </h3>
                            {item.plantVariety && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                                {item.plantVariety}
                              </p>
                            )}
                          </div>
                          <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadge(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {item.plotName} • Rząd {item.rowNumber}
                        </p>
                      </div>

                      {/* Progress Bar - Optimized */}
                      {item.progressPercent !== undefined && item.progressPercent !== null && (
                        <div className="mt-2 md:mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400 font-medium truncate mr-2">
                              {formatDaysUntil(item.daysUntilHarvest) ||
                               `${item.daysSincePlanted} dni`}
                            </span>
                            <span className="text-gray-900 dark:text-white font-bold flex-shrink-0">
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
                              role="progressbar"
                              aria-valuenow={item.progressPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Postęp wzrostu: ${item.progressPercent}%`}
                            >
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Mobile Optimized */}
        {(!profile.timeline || profile.timeline.length === 0) &&
         (!profile.gallery || profile.gallery.length === 0) &&
         !profile.stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 md:p-12 text-center">
            <Sprout size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4 md:w-16 md:h-16" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ten ogród dopiero się rozwija
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
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

      {/* Photo Lightbox - Mobile Optimized */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 md:p-4"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Podgląd zdjęcia"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            aria-label="Zamknij podgląd"
            className="absolute top-2 right-2 md:top-4 md:right-4 p-3 md:p-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
          <div className="max-w-5xl w-full">
            <img
              src={`${process.env.REACT_APP_API_URL || ''}/${selectedPhoto.path}`}
              alt={selectedPhoto.caption || selectedPhoto.plantName}
              className="w-full h-auto max-h-[80vh] md:max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {(selectedPhoto.caption || selectedPhoto.plantName) && (
              <div className="mt-3 md:mt-4 text-center px-4">
                <p className="text-white text-base md:text-lg font-medium">
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

      {/* Share Modal - Mobile Optimized */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="share-modal-title" className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                Udostępnij profil
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                aria-label="Zamknij modal"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded transition min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="profile-link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link do profilu:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="profile-link"
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm min-h-[44px]"
                    aria-label="Link do profilu"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 active:bg-green-800 dark:active:bg-green-900 transition text-sm font-medium min-h-[44px] touch-manipulation"
                  >
                    {copySuccess ? '✓ Skopiowano' : 'Kopiuj'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
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
