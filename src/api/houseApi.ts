// src/api/houseApi.ts
// 使用统一的 apiClient（自动携带 token），不再直接使用 axios

import apiClient from "./client";

const API_BASE_URL = "/houses";

export interface HouseFilters {
  page?: number;
  per_page?: number;
  region?: string;
  block?: string;
  community?: string;
  rooms?: string;
  min_price?: number;
  max_price?: number;
  rent_type?: string;
  subway?: number;
  decoration?: string;
  available?: number;
  orientation?: string;
}

export interface HouseInfo {
  id: number;
  title: string;
  region: string;
  block: string | null;
  community: string;
  rooms: string;
  area: number;
  price: number;
  rent_type: string;
  publish_time: string;
  image_url?: string;
  description?: string;
  floor?: string;
  total_floors?: number;
  direction: string;
  subway?: number;
  decoration?: string;
  available?: number;
  contact_person?: string;
  contact_phone?: string;
  features?: string[];
  tag_new?: number;
  landlord?: string;
  house_num?: string;
  page_views?: string;
  phone_num?: string;
}

export interface PaginatedHouseResponse {
  items: HouseInfo[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const fetchHouses = async (filters: HouseFilters): Promise<PaginatedHouseResponse> => {
  const paramsToSend: any = { ...filters };

  Object.keys(paramsToSend).forEach((key) => {
    const k = key as keyof HouseFilters;
    if (paramsToSend[k] === undefined || paramsToSend[k] === "") {
      delete paramsToSend[k];
    }
  });

  const response = await apiClient.get(`${API_BASE_URL}/`, {
    params: paramsToSend,
  });

  // 响应拦截器已自动解包 {code,data,message,success}，response.data 即为 PaginatedHouseResponse
  return response.data as PaginatedHouseResponse;
};

export const fetchHouseById = async (id: number): Promise<HouseInfo> => {
  const response = await apiClient.get(`${API_BASE_URL}/${id}`);

  // 响应拦截器已自动解包，response.data 即为 HouseInfo
  return response.data as HouseInfo;
};
