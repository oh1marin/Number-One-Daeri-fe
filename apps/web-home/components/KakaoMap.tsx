"use client";

import { useEffect, useState } from "react";
import { useKakaoLoader, Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { MapFallbackIcon } from "./Icons";

const ADDRESS = "경기도 수원시 권선구 효원로 226 덕화빌딩 302호";
const PLACE_NAME = "일등대리";
// 기본 좌표 (Geocoder 실패 시 fallback) — 수원 권선구 효원로 226 근처
const DEFAULT_COORDS = { lat: 37.2642, lng: 127.0248 };
const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "";

function getKakaoLinks(coords: { lat: number; lng: number }) {
  return {
    search: `https://map.kakao.com/link/search/${encodeURIComponent(ADDRESS)}`,
    map: `https://map.kakao.com/link/map/${encodeURIComponent(PLACE_NAME)},${coords.lat},${coords.lng}`,
    directions: `https://map.kakao.com/link/to/${encodeURIComponent(PLACE_NAME)},${coords.lat},${coords.lng}`,
  };
}

function KakaoMapWithKey() {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, error] = useKakaoLoader({ appkey: APP_KEY, libraries: ["services"] });

  // 주소 → 좌표 변환 (Geocoder)
  useEffect(() => {
    if (loading || error || typeof window === "undefined") return;
    const kakao = (window as unknown as { kakao?: { maps: { services: { Geocoder: new () => { addressSearch: (addr: string, cb: (result: { y: string; x: string }[], status: string) => void) => void } } } } }).kakao;
    if (!kakao?.maps?.services) return;

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(ADDRESS, (result, status) => {
      if (status === "OK" && result?.[0]) {
        setCoords({ lat: Number(result[0].y), lng: Number(result[0].x) });
      }
    });
  }, [loading, error]);

  const links = getKakaoLinks(coords);

  if (error) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[480px] flex flex-col bg-gray-100">
        <a
          href={links.search}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center text-gray-600 hover:opacity-90 transition px-4"
        >
          <div className="mb-3">{MapFallbackIcon}</div>
          <p className="font-medium text-gray-700 mb-1">카카오맵에서 보기</p>
          <p className="text-sm text-gray-500 text-center">{ADDRESS}</p>
          <p className="mt-2 text-xs text-amber-800 text-center max-w-sm">
            임베드 지도가 안 뜨면 카카오 개발자 콘솔 → 앱 → 플랫폼 → Web에 이 사이트 도메인(예: Vercel 주소)을 등록했는지 확인하세요.
          </p>
          <p className="mt-3 px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-lg">
            지도 열기
          </p>
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[480px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500 text-sm">지도 로딩 중...</p>
      </div>
    );
  }

  const mapProps = {
    center: coords,
    level: 3,
    style: { width: "100%", height: "100%" } as React.CSSProperties,
  };
  const lockProps = {
    draggable: false,
    zoomable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
  };
  const interactiveProps = {
    draggable: true,
    zoomable: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
  };

  const MapContent = ({ interactive = false }: { interactive?: boolean }) => (
    <Map {...mapProps} {...(interactive ? interactiveProps : lockProps)}>
      <MapMarker position={coords} />
      <CustomOverlayMap position={coords} xAnchor={0.5} yAnchor={1}>
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "white",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
            marginBottom: "36px",
          }}
        >
          <span
            style={{
              color: "#2563eb",
              fontWeight: 700,
              fontSize: "15px",
              display: "block",
              width: "100%",
              textAlign: "center",
            }}
          >
            일등대리
          </span>
        </div>
      </CustomOverlayMap>
    </Map>
  );

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[480px] relative flex flex-col">
        <div className="flex-1 min-h-0 relative w-full">
          <MapContent />
        </div>
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold shadow-lg transition z-10"
        >
          전체화면
        </button>
        <div className="flex divide-x divide-gray-200 bg-white border-t shrink-0">
          <a
            href={links.map}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-center text-sm text-blue-600 hover:underline"
          >
            카카오맵에서 크게 보기
          </a>
          <a
            href={links.directions}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-center text-sm text-blue-600 hover:underline"
          >
            길찾기
          </a>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
            <span className="font-semibold text-gray-800">일등대리 지도</span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
            >
              닫기
            </button>
          </div>
          <div className="flex-1 min-h-0 relative w-full">
            <MapContent interactive />
          </div>
        </div>
      )}
    </>
  );
}

function FallbackLink() {
  const links = getKakaoLinks(DEFAULT_COORDS);
  return (
    <div className="h-[480px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex flex-col">
      <a
        href={links.search}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex flex-col items-center justify-center text-gray-600 hover:opacity-90 transition px-4"
      >
        <div className="mb-3">{MapFallbackIcon}</div>
        <p className="font-medium text-gray-700 mb-1">카카오맵에서 보기</p>
        <p className="text-sm text-gray-500 text-center">{ADDRESS}</p>
        <p className="mt-2 text-xs text-amber-800 text-center max-w-sm">
          배포 사이트에서는 Vercel 환경 변수에 NEXT_PUBLIC_KAKAO_MAP_KEY(JavaScript 키)를 넣고, 값을 바꾼 뒤에는 반드시 다시 배포해야 합니다.
        </p>
      </a>
      <div className="flex border-t border-gray-200">
        <a
          href={links.search}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 text-center text-sm font-semibold bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
        >
          지도 열기
        </a>
        <a
          href={links.directions}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          길찾기
        </a>
      </div>
    </div>
  );
}

export default function KakaoMap() {
  if (!APP_KEY) return <FallbackLink />;
  return <KakaoMapWithKey />;
}
