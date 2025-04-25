export default function BirdImage({ imageUrl, name }: { imageUrl: string, name?: string }) {
    return (
      <div className="absolute top-4 right-4 z-10 bg-white shadow-lg rounded-lg overflow-hidden w-64 border border-gray-200">
        <img src={imageUrl} alt={name ?? "Bird"} className="w-full h-40 object-cover" />
        <div className="p-2 text-center text-sm text-gray-700">
          {name ?? "???"}（この鳥はどこに生息している？）
        </div>
      </div>
    )
  }