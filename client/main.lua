local EconomyMarket = {}
local isMarketOpen = false

function EconomyMarket:new()
    local obj = {}
    setmetatable(obj, self)
    self.__index = self
    obj.selectedItems = {}
    obj.inventoryData = {}
    obj.priceData = {}
    return obj
end

function EconomyMarket:init()
    self:loadPrices()
    self:setupEventHandlers()
    self:createSellPoints()
    self:createBlips()
end

function EconomyMarket:loadPrices()
    for itemType, config in pairs(Config.Items) do
        self.priceData[itemType] = {
            name = config.name,
            current = config.basePrice,
            trend = "stable",
            min = config.minPrice,
            max = config.maxPrice
        }
    end
end

function EconomyMarket:setupEventHandlers()

    

    
    RegisterNetEvent("economy:receiveInventory")
    AddEventHandler("economy:receiveInventory", function(inventoryData)
        self:receiveInventory(inventoryData)
    end)

    RegisterNetEvent("economy:sellResult")
    AddEventHandler("economy:sellResult", function(success, message)
        if success then
            self:showNotification(message)
            TriggerServerEvent("economy:requestInventory")
        else
            self:showNotification("Error: " .. message)
        end
    end)

    RegisterNetEvent("economy:updatePrices")
    AddEventHandler("economy:updatePrices", function(priceData)
        self:receivePriceUpdate(priceData)
    end)
end

function EconomyMarket:openMarket()
    isMarketOpen = true
    TriggerServerEvent("economy:requestInventory")

end

function EconomyMarket:receiveInventory(inventoryData)
    self.inventoryData = inventoryData
 
    SetNuiFocus(true, true)
    PlaySoundFrontend("INFO_HIDE", "HUD_SHOP_SOUNDSET", true,1)
    AnimpostfxPlay("PhotoMode_Bounds")
    SendNUIMessage({
        type = "openMarket",
        inventory = self.inventoryData,
        prices = self.priceData
    })
end

function EconomyMarket:closeMarket()
    isMarketOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({
        type = "closeMarket"
    })
    AnimpostfxStop("PhotoMode_Bounds")
    PlaySoundFrontend("INFO_HIDE", "HUD_SHOP_SOUNDSET", true,1)
end

function EconomyMarket:receivePriceUpdate(priceData)
    for itemType, data in pairs(priceData) do
        if self.priceData[itemType] then
            self.priceData[itemType].current = data.currentPrice
            self.priceData[itemType].trend = data.trend
        end
    end
    
    if isMarketOpen then
        SendNUIMessage({
            type = "updatePrices",
            prices = self.priceData
        })
    end
end

function EconomyMarket:createSellPoints()
    CreateThread(function()
        while true do
            local playerCoords = GetEntityCoords(PlayerPedId())
            local sleep = 1000
            local showUI = false
            
            if not isMarketOpen then
                for i, point in pairs(Config.SellPoints) do
                    local distance = #(playerCoords - point.coords)
                    
                    if distance < 15.0 then
                        sleep = 0
                        Citizen.InvokeNative(0x2A32FAA57B937173,
                            -1795314153,
                            point.coords.x,
                            point.coords.y + 0.3,
                            point.coords.z - 5.0,
                            0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                            0.2,
                            0.2,
                            6.0,
                            255, 199, 0,
                            50,
                            false, false, 2, false, nil, nil, false
                        )
                    
                    end
                    if distance < 3.0 then
                        sleep = 0
                        showUI = true
                        
                       
                        if distance < 3.0 then
                            if IsControlJustPressed(0, 0x760A9C6F) then
                                SendNUIMessage({
                                    type = "showSellPrompt",
                                    show = false
                                })
                                self:openMarket()
                            
                                Wait(2000)
                            end
                        end
                    end
                end
            end
            
            if showUI and not isMarketOpen then
                SendNUIMessage({
                    type = "showSellPrompt",
                    show = true
                })
            else
                SendNUIMessage({
                    type = "showSellPrompt",
                    show = false
                })
            end
            
            Wait(sleep)
        end
    end)
end

function EconomyMarket:createBlips()
    self.blips = {}
    
    for i, point in pairs(Config.SellPoints) do
        local blip = Citizen.InvokeNative(0x554D9D53F696D002, 1664425300, point.coords.x, point.coords.y, point.coords.z)
        SetBlipSprite(blip, GetHashKey("blip_ambient_secret"), true)
        SetBlipScale(blip, 0.9)
        Citizen.InvokeNative(0x9CB1A1623062F402, blip, "Economy")
        
        local radiusBlip = Citizen.InvokeNative(0x45F13B7E0A15C880, 2033377404, point.coords, 10.0)
        
        table.insert(self.blips, blip)
        table.insert(self.blips, radiusBlip)
    end
end

function EconomyMarket:clearBlips()
    if self.blips then
        for _, blip in pairs(self.blips) do
            if DoesBlipExist(blip) then
                RemoveBlip(blip)
            end
        end
        self.blips = {}
    end
end

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        local market = EconomyMarket:new()
        market:clearBlips()
    end
end)

RegisterNUICallback("sellItems", function(data, cb)
    local market = EconomyMarket:new()
    PlaySoundFrontend("BET_PROMPT", "HUD_POKER", true, 1)
    market:processSell(data.items)

    cb("ok")
end)

function EconomyMarket:processSell(items)
    TriggerServerEvent("economy:sellItems", items)
end

function EconomyMarket:showNotification(message)
    SendNUIMessage({
        type = "showNotification",
        message = message,
        notificationType = "info"
    })
end

RegisterNUICallback("closeMarket", function(data, cb)
    local market = EconomyMarket:new()
    market:closeMarket()
    cb("ok")
end)

RegisterNUICallback("paysfx", function(data, cb)
    PlaySoundFrontend("INFO_HIDE", "HUD_SHOP_SOUNDSET", true,1)
    cb("ok")
end)
local market = EconomyMarket:new()
market:init()