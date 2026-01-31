import React from 'react';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PageErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">😵</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Wystapil blad na tej stronie
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Pozostale strony powinny dzialac normalnie.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded mb-4 overflow-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Sprobuj ponownie
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
