resource "azurerm_resource_group" "nomsol_comcrate_rg" {
  name     = var.azr_resource_group_name
  location = "East US"
}

resource "azurerm_service_plan" "nomsol_comcrate_plan" {
  name                = "NomSol-CommuniCrate-Plan"
  location            = azurerm_resource_group.nomsol_comcrate_rg.location
  resource_group_name = azurerm_resource_group.nomsol_comcrate_rg.name
  os_type             = "Linux"
  sku_name            = "F1"
}

resource "azurerm_linux_web_app" "nomsol_comcrate_cc" {
  name                = var.web_app_name
  resource_group_name = azurerm_resource_group.nomsol_comcrate_rg.name
  location            = azurerm_service_plan.nomsol_comcrate_plan.location
  service_plan_id     = azurerm_service_plan.nomsol_comcrate_plan.id

  site_config {
    application_stack {
      docker_image_name   = "jermydev/communicrate:latest"
      docker_registry_url = "https://index.docker.io"
    }
    always_on = false # must be false for free (F1) tier
  }

  app_settings = {
    "WEBSITES_PORT"                       = "3000"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "MONGODB_URI"                         = var.MONGODB_URI
    "VAPID_PUBLIC_KEY"                    = var.VAPID_PUBLIC_KEY
    "VAPID_PRIVATE_KEY"                   = var.VAPID_PRIVATE_KEY
    "MAILTO_ADDRESS"                      = var.MAILTO_ADDRESS
  }
}