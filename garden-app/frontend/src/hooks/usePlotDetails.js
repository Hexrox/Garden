import { useState, useEffect } from 'react';
import axios from '../config/axios';

/**
 * Custom hook for fetching plot details with all beds
 *
 * Centralizes the common pattern of fetching plots and their details
 * Handles cleanup, abort signals, and parallel requests
 *
 * @returns {Object} { plots, beds, loading, error, refetch }
 */
const usePlotDetails = () => {
  const [plots, setPlots] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all plots
      const plotsResponse = await axios.get('/api/plots', { signal });

      // Fetch details for all plots in parallel
      const detailsPromises = plotsResponse.data.map(plot =>
        axios.get(`/api/plots/${plot.id}/details`, { signal })
      );

      const detailsResults = await Promise.all(detailsPromises);

      // Extract all beds with plot information
      const allBeds = [];
      detailsResults.forEach((detailsResponse, idx) => {
        const plot = plotsResponse.data[idx];
        const plotBeds = detailsResponse.data.beds || [];

        plotBeds.forEach(bed => {
          allBeds.push({
            ...bed,
            plot_id: plot.id,
            plot_name: plot.name
          });
        });
      });

      setPlots(plotsResponse.data);
      setBeds(allBeds);
      return { plots: plotsResponse.data, beds: allBeds };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching plot details:', err);
        setError('Nie udało się załadować danych. Spróbuj ponownie.');
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        await fetchData(controller.signal);
      } catch (err) {
        // Error already handled in fetchData
      }
    };

    if (isMounted) {
      load();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Manual refetch function
  const refetch = async () => {
    const controller = new AbortController();
    try {
      return await fetchData(controller.signal);
    } catch (err) {
      // Error already handled
    }
  };

  return { plots, beds, loading, error, refetch };
};

export default usePlotDetails;
