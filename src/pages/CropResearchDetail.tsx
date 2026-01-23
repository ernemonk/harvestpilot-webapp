import { useParams, useNavigate } from 'react-router-dom';
import { useFirestoreDoc } from '../hooks/useFirestore';
import type { CropResearch } from '../types';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function CropResearchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: crop, loading, error } = useFirestoreDoc<CropResearch>('cropResearch', id || '');

  if (loading) return <LoadingSpinner message="Loading crop details..." />;
  if (error) return <ErrorMessage message={`Error loading crop: ${error}`} />;
  if (!crop) return <ErrorMessage message="Crop not found" />;

  const getSuitabilityStars = (rating: number | undefined | null) => {
    return '⭐'.repeat(rating || 0);
  };

  const getSuitabilityColor = (rating: number | undefined | null) => {
    if (!rating) return 'text-gray-600';
    if (rating === 5) return 'text-green-600 font-semibold';
    if (rating === 4) return 'text-emerald-600';
    if (rating === 3) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getIntensityBadge = (intensity: string | undefined | null) => {
    if (!intensity) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      'Low': 'bg-green-100 text-green-800',
      'Low-Medium': 'bg-emerald-100 text-emerald-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Medium-High': 'bg-orange-100 text-orange-800',
      'High': 'bg-red-100 text-red-800',
      'Very High': 'bg-red-200 text-red-900',
    };
    return colors[intensity] || 'bg-gray-100 text-gray-800';
  };

  const getDemandBadge = (demand: string | undefined | null) => {
    if (!demand) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      'Very High': 'bg-purple-100 text-purple-800',
      'High': 'bg-blue-100 text-blue-800',
      'Medium-High': 'bg-cyan-100 text-cyan-800',
      'Medium': 'bg-teal-100 text-teal-800',
      'Low': 'bg-gray-100 text-gray-800',
      'Growing': 'bg-indigo-100 text-indigo-800',
    };
    return colors[demand] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/crop-research')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Research
      </button>

      {/* Header Card */}
      <Card className="mb-6">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{crop.name}</h1>
              <p className="text-lg text-gray-600">{crop.category}</p>
            </div>
            <div className={`text-right ${getSuitabilityColor(crop.bayAreaSuitability)}`}>
              <div className="text-4xl mb-1">{getSuitabilityStars(crop.bayAreaSuitability)}</div>
              <div className="text-sm font-medium">Bay Area Suitability</div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-600">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider">Revenue/Acre</p>
              <p className="text-xl font-bold text-emerald-700">{crop.annualRevenuePerAcre}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider">Profit Margin</p>
              <p className="text-xl font-bold text-green-700">{crop.profitMargin}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider">Growing Time</p>
              <p className="text-xl font-bold text-blue-700">{crop.growingTime}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider">Startup Cost/Acre</p>
              <p className="text-xl font-bold text-purple-700">{crop.startupCostPerAcre}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Market & Production Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Market Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Market Demand</p>
                <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getDemandBadge(crop.marketDemand)}`}>
                  📈 {crop.marketDemand}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Price Per Pound</p>
                <p className="text-lg font-semibold text-gray-900">{crop.pricePerPound}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Harvest Frequency</p>
                <p className="text-lg font-semibold text-gray-900">{crop.harvestFrequency}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🌱</span> Production Requirements
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Labor Intensity</p>
                <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getIntensityBadge(crop.laborIntensity)}`}>
                  💪 {crop.laborIntensity}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Water Needs</p>
                <p className="text-lg font-semibold text-gray-900">{crop.waterNeeds}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Soil Type</p>
                <p className="text-lg font-semibold text-gray-900">{crop.soilType}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Growing Details */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🌿</span> Growing Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Nutrient Requirements</h3>
              <p className="text-gray-900">{crop.nutrientRequirements}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Common Pests</h3>
              <p className="text-gray-900">{crop.commonPests}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Common Diseases</h3>
              <p className="text-gray-900">{crop.commonDiseases}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes & Additional Information */}
      {crop.notes && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📝</span> Additional Notes
            </h2>
            <p className="text-gray-700 leading-relaxed">{crop.notes}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
