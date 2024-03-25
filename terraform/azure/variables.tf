variable "azr_resource_group_name" {
  description = "Azure Resource Group Name"
  type        = string
}

variable "web_app_name" {
  description = "Web App Name"
  type        = string
  default     = "NomSol-CommuniCrate-App"
}

variable "MONGODB_URI" {
  description = "MongoDB URI"
  type        = string
  sensitive   = true
}

variable "VAPID_PUBLIC_KEY" {
  description = "Valid Public Key"
  type        = string
  sensitive   = true
}

variable "VAPID_PRIVATE_KEY" {
  description = "Valid Private Key"
  type        = string
  sensitive   = true
}

variable "MAILTO_ADDRESS" {
  description = "Mailto Address"
  type        = string
  sensitive   = true
}