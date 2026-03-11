export type InquiryTemplateType =
  | 'availability_check'
  | 'viewing_request'
  | 'price_negotiation'
  | 'general_inquiry'
  | 'custom';

export type InquiryStatus = 'awaiting_response' | 'responded' | 'no_response' | 'deleted';

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  file_size: number; // bytes
  uploaded_at: Date;
}

export interface ContactPreferences {
  phone: boolean;
  email: boolean;
  whatsapp: boolean;
}

// Minimal profile reference (avoid circular imports)
export interface ProfileRef {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
}

// Minimal property reference
export interface PropertyRef {
  id: string;
  title: string;
  thumbnail_url: string | null;
  city_name: string | null;
}

export interface Inquiry {
  id: string;
  tenant_id: string;
  landlord_id: string;
  property_id: string;
  template_type: InquiryTemplateType;
  message: string;
  contact_preferences?: ContactPreferences;
  attachments?: Attachment[];
  status: InquiryStatus;
  is_read_by_landlord: boolean;
  read_at?: Date;
  has_response: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  // Populated relations (optional)
  tenant?: ProfileRef;
  landlord?: ProfileRef;
  property?: PropertyRef;
}

export interface InquiryResponse {
  id: string;
  inquiry_id: string;
  sender_id: string;
  message: string;
  attachments?: Attachment[];
  is_read_by_tenant: boolean;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
  sender?: ProfileRef;
}

export interface InquiryTemplate {
  id: string;
  template_type: InquiryTemplateType;
  title: string;
  message_body: string;
  is_default: boolean;
  language: 'en' | 'fr';
  created_at: Date;
  updated_at: Date;
}

export interface SendInquiryRequest {
  property_id: string;
  landlord_id: string;
  template_type: InquiryTemplateType;
  message: string;
  contact_preferences?: ContactPreferences;
  attachment_ids?: string[];
}

export interface SendInquiryResponse {
  success: boolean;
  inquiry?: Inquiry;
  error?: string;
}

export interface InquiryListResult {
  inquiries: Inquiry[];
  total: number;
  page: number;
  hasMore: boolean;
}
