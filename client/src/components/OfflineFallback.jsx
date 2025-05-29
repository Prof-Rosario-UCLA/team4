const OfflineFallback = () => {
    return (
      <div className="w-full h-full">
          <section className="h-[40vh] flex flex-col items-center justify-center mt-8">
              <img src="/pwa-192x192.png" alt="App Logo" className="w-30 h-30 mb-4" />
              <h2 className="text-2xl font-bold mb-4">You're Offline</h2>
              <p className="text-gray-600 mb-4">
                We're trying to reconnect to the server...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-green-600"></div>
          </section>
      </div>
    )
  }
  
  export default OfflineFallback