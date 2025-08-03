import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

import { Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDeviceSchema } from "@shared/schema";
import type { InsertDevice, MqttInstance, DeviceCapability } from "@shared/schema";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const deviceTypes = [
  { value: "devices.types.light", label: "Освещение" },
  { value: "devices.types.switch", label: "Выключатель" },
  { value: "devices.types.sensor", label: "Датчик" },
  { value: "devices.types.thermostat", label: "Термостат" },
  { value: "devices.types.media_device", label: "Медиа устройство" },
  { value: "devices.types.openable", label: "Открываемое устройство" },
  { value: "devices.types.other", label: "Другое" },
];

const capabilityTypes = [
  { value: "devices.capabilities.on_off", label: "On/Off" },
  { value: "devices.capabilities.range", label: "Range" },
  { value: "devices.capabilities.toggle", label: "Toggle" },
  { value: "devices.capabilities.color_setting", label: "Color Setting" },
];

export default function AddDeviceModal({ isOpen, onClose }: AddDeviceModalProps) {
  const [mqttInstances, setMqttInstances] = useState<MqttInstance[]>([
    { instance: "on", set: "", state: "" },
  ]);
  const [isMqttEditedManually, setIsMqttEditedManually] = useState(false);
  const [capabilities, setCapabilities] = useState<DeviceCapability[]>([
    { type: "devices.capabilities.on_off", retrievable: true, reportable: true },
  ]);
  const [newRoom, setNewRoom] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rooms = [] } = useQuery<string[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<InsertDevice>({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      id: "",
      name: "",
      room: "",
      type: "",
      mqtt: mqttInstances,
      capabilities: capabilities,
      valueMapping: [
        {
          type: "on_off",
          mapping: [[false, true], ["off", "on"]],
        },
      ],
    },
  });

  useEffect(() => {
    if (!isMqttEditedManually) {
      const name = form.watch("name") || "";
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w_]+/g, "");

      const updated = [...mqttInstances];
      updated[0] = {
        ...updated[0],
        set: `input/${slug}`,
        state: `input/${slug}`,
      };
      setMqttInstances(updated);
    }
  }, [form.watch("name")]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertDevice) => {
      const response = await apiRequest("POST", "/api/devices", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Устройство создано",
        description: "Устройство было успешно добавлено в конфигурацию",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать устройство",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setMqttInstances([{ instance: "on", set: "", state: "" }]);
    setIsMqttEditedManually(false);
    setCapabilities([{ type: "devices.capabilities.on_off", retrievable: true, reportable: true }]);
    setNewRoom("");
  };

  const addMqttInstance = () => {
    setMqttInstances([...mqttInstances, { instance: "", set: "", state: "" }]);
  };

  const removeMqttInstance = (index: number) => {
    setMqttInstances(mqttInstances.filter((_, i) => i !== index));
  };

  const updateMqttInstance = (index: number, field: keyof MqttInstance, value: string) => {
    const updated = [...mqttInstances];
    updated[index] = { ...updated[index], [field]: value };
    setMqttInstances(updated);

    if (field === "set" || field === "state") {
      setIsMqttEditedManually(true);
    }
  };

  const addCapability = () => {
    setCapabilities([...capabilities, { type: "", retrievable: true, reportable: true }]);
  };

  const removeCapability = (index: number) => {
    setCapabilities(capabilities.filter((_, i) => i !== index));
  };

  const updateCapability = (index: number, field: keyof DeviceCapability, value: any) => {
    const updated = [...capabilities];
    updated[index] = { ...updated[index], [field]: value };
    setCapabilities(updated);
  };

  const onSubmit = (data: InsertDevice) => {
    const finalRoom = data.room === "new" ? newRoom : data.room;
    createMutation.mutate({
      ...data,
      room: finalRoom,
      mqtt: mqttInstances,
      capabilities: capabilities,
    });
  };

  const generatePreviewJson = () => {
    const formData = form.getValues();
    const finalRoom = formData.room === "new" ? newRoom : formData.room;

    return {
      id: "id_device_new",
      name: formData.name || "Новое устройство",
      room: finalRoom || "Зал",
      type: formData.type || "devices.types.light",
      mqtt: mqttInstances,
      capabilities: capabilities,
      valueMapping: formData.valueMapping,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Добавить новое устройство
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Имя, ID, тип и комната */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название устройства</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID устройства</FormLabel>
                    <FormControl>
                      <Input placeholder="id_device_..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комната</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите комнату" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room} value={room}>
                            {room}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Добавить новую комнату</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("room") === "new" && (
                <FormItem className="md:col-span-2">
                  <FormLabel>Название новой комнаты</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите название комнаты..."
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип устройства</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* MQTT */}
            <div>
              <h4 className="text-md font-semibold mb-4">MQTT настройки</h4>
              {mqttInstances.map((instance, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <Input
                    placeholder="Instance"
                    value={instance.instance}
                    onChange={(e) => updateMqttInstance(index, "instance", e.target.value)}
                  />
                  <Input
                    placeholder="Set Topic"
                    value={instance.set}
                    onChange={(e) => updateMqttInstance(index, "set", e.target.value)}
                  />
                  <Input
                    placeholder="State Topic"
                    value={instance.state}
                    onChange={(e) => updateMqttInstance(index, "state", e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addMqttInstance}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить MQTT instance
              </Button>
            </div>

            {/* Capabilities */}
            <div>
              <h4 className="text-md font-semibold mb-4">Capabilities</h4>
              {capabilities.map((cap, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 mb-3">
                  <Select
                    value={cap.type}
                    onValueChange={(value) => updateCapability(index, "type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {capabilityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-4 items-center">
                    <label>
                      <Checkbox
                        checked={cap.retrievable}
                        onCheckedChange={(c) => updateCapability(index, "retrievable", c === true)}
                      />
                      Retrievable
                    </label>
                    <label>
                      <Checkbox
                        checked={cap.reportable}
                        onCheckedChange={(c) => updateCapability(index, "reportable", c === true)}
                      />
                      Reportable
                    </label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addCapability}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить Capability
              </Button>
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-md font-semibold mb-4">Предпросмотр JSON</h4>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(generatePreviewJson(), null, 2)}</pre>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" className="bg-primary text-white">
                <Save className="h-4 w-4 mr-2" />
                Сохранить устройство
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
