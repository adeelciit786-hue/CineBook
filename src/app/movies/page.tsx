'use client';

import React, { useState, useEffect } from 'react';
import { MovieCard } from '@/components/movie-card';
import { Search, Filter, Film, Sparkles, X } from 'lucide-react';

export default function MoviesCatalogPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedGenre) params.append('genre', selectedGenre);
        if (selectedLanguage) params.append('language', selectedLanguage);

        const res = await fetch(`/api/movies?${params.toString()}`);
        const data = await res.json();
        setMovies(data.movies || []);
        if (data.genres) setGenres(data.genres);
      } catch (err) {
        console.error('Error fetching movies catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = setTimeout(fetchMovies, 200);
    return () => clearTimeout(timeout);
  }, [search, selectedGenre, selectedLanguage]);

  const clearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setSelectedLanguage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-widest">
          <Film className="w-4 h-4" />
          <span>Theatrical Catalogue</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
          Explore Movies & Showtimes
        </h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Search blockbusters, filter by genre or language, and find the perfect showtime at
          your favorite CineBook multiplex.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, cast, or director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-light text-white text-sm placeholder-gray-400 border border-white/10 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Genre Dropdown */}
          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-light text-white text-sm border border-white/10 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-light text-white text-sm border border-white/10 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(search || selectedGenre || selectedLanguage) && (
          <div className="flex items-center space-x-2 pt-2 text-xs">
            <span className="text-gray-400 font-medium">Active filters:</span>
            {search && (
              <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                Keyword: "{search}"
              </span>
            )}
            {selectedGenre && (
              <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                Genre: {genres.find((g) => g.slug === selectedGenre)?.name}
              </span>
            )}
            {selectedLanguage && (
              <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                Language: {selectedLanguage}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Showing {movies.length} movies</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[2/3] rounded-2xl bg-surface-light animate-pulse"
              />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center glass-panel rounded-3xl space-y-4">
            <Film className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-xl font-bold text-white">No matching movies found</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              We couldn't find any movies matching your current search parameters.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-full bg-primary text-black font-bold text-xs hover:brightness-110 shadow-glow-gold"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
