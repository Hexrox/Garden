import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const PlotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plot, setPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBedForm, setShowBedForm] = useState(false);
  const [bedForm, setBedForm] = useState({
    row_number: '',
    plant_name: '',
    plant_variety: '',
    planted_date: '',
    note: ''
  });

  useEffect(() => {
    loadPlotDetails();
  }, [id]);

  const loadPlotDetails = async () => {
    try {
      const response = await axios.get(`/api/plots/${id}/details`);
      setPlot(response.data);
    } catch (error) {
      console.error('Error loading plot details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/plots/${id}/beds`, bedForm);
      setBedForm({
        row_number: '',
        plant_name: '',
        plant_variety: '',
        planted_date: '',
        note: ''
      });
      setShowBedForm(false);
      loadPlotDetails();
    } catch (error) {
      console.error('Error adding bed:', error);
      alert('Błąd podczas dodawania grządki');
    }
  };

  if (loading) return <div className="text-center py-12">Ładowanie...</div>;
  if (!plot) return <div className="text-center py-12">Poletko nie znalezione</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{plot.name}</h1>
          <p className="text-gray-600 mt-2">{plot.description}</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/plots/${id}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edytuj poletko
          </Link>
          <button
            onClick={() => setShowBedForm(!showBedForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            + Dodaj grządkę
          </button>
        </div>
      </div>

      {showBedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Nowa grządka</h3>
          <form onSubmit={handleAddBed} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer rzędu *
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={bedForm.row_number}
                  onChange={(e) => setBedForm({ ...bedForm, row_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa rośliny
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={bedForm.plant_name}
                  onChange={(e) => setBedForm({ ...bedForm, plant_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odmiana
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={bedForm.plant_variety}
                  onChange={(e) => setBedForm({ ...bedForm, plant_variety: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data posadzenia
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={bedForm.planted_date}
                  onChange={(e) => setBedForm({ ...bedForm, planted_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notatki
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="3"
                value={bedForm.note}
                onChange={(e) => setBedForm({ ...bedForm, note: e.target.value })}
              ></textarea>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Dodaj
              </button>
              <button
                type="button"
                onClick={() => setShowBedForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Grządki ({plot.beds?.length || 0})
          </h2>
        </div>
        {plot.beds && plot.beds.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {plot.beds.map((bed) => (
              <div key={bed.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      Rząd {bed.row_number} - {bed.plant_name || 'Brak rośliny'}
                    </h3>
                    {bed.plant_variety && (
                      <p className="text-sm text-gray-600">Odmiana: {bed.plant_variety}</p>
                    )}
                    {bed.planted_date && (
                      <p className="text-sm text-gray-600">Posadzone: {bed.planted_date}</p>
                    )}
                    {bed.note && (
                      <p className="text-sm text-gray-600 mt-1">{bed.note}</p>
                    )}
                    {bed.sprays && bed.sprays.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">
                          Opryski ({bed.sprays.length}):
                        </p>
                        {bed.sprays.slice(0, 2).map((spray) => (
                          <div key={spray.id} className="text-xs text-gray-600 ml-2">
                            • {spray.spray_name} - {spray.spray_date} (karencja: {spray.withdrawal_period} dni)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link
                      to={`/beds/${bed.id}/spray`}
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      + Dodaj oprysk
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            Brak grządek. Dodaj pierwszą grządkę, aby rozpocząć.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlotDetail;
