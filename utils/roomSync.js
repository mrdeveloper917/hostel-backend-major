import Room from "../models/Room.js";

const DEFAULT_ROOM_CAPACITY = 4;

const normalizeBlock = (block = "") => block.trim();
const normalizeRoomNumber = (roomNumber = "") => roomNumber.trim();
const normalizeFloor = (floorNumber) => {
  if (floorNumber === undefined || floorNumber === null || floorNumber === "") {
    return null;
  }

  const parsedFloor = Number(floorNumber);
  return Number.isNaN(parsedFloor) ? null : parsedFloor;
};

const updateRoomStatus = (room) => {
  room.status = room.occupants.length >= room.capacity ? "full" : "available";
};

export const findRoomByStudentDetails = async (user) => {
  const block = normalizeBlock(user.hostelName);
  const roomNumber = normalizeRoomNumber(user.roomNumber);
  const floor = normalizeFloor(user.floorNumber);

  if (!block || !roomNumber || floor === null) {
    return null;
  }

  return Room.findOne({ block, floor, roomNumber });
};

export const syncStudentRoom = async (user) => {
  if (user.role !== "student") {
    return null;
  }

  const block = normalizeBlock(user.hostelName);
  const roomNumber = normalizeRoomNumber(user.roomNumber);
  const floor = normalizeFloor(user.floorNumber);

  if (!block || !roomNumber || floor === null) {
    if (user.room) {
      const previousRoom = await Room.findById(user.room);
      if (previousRoom) {
        previousRoom.occupants = previousRoom.occupants.filter(
          (id) => id.toString() !== user._id.toString()
        );
        updateRoomStatus(previousRoom);
        await previousRoom.save();
      }

      user.room = null;
    }

    return null;
  }

  let room = await Room.findOne({ block, floor, roomNumber });

  if (!room) {
    room = await Room.create({
      block,
      floor,
      roomNumber,
      capacity: DEFAULT_ROOM_CAPACITY,
      occupants: [],
      status: "available",
    });
  }

  if (user.room && user.room.toString() !== room._id.toString()) {
    const previousRoom = await Room.findById(user.room);
    if (previousRoom) {
      previousRoom.occupants = previousRoom.occupants.filter(
        (id) => id.toString() !== user._id.toString()
      );
      updateRoomStatus(previousRoom);
      await previousRoom.save();
    }
  }

  if (!room.occupants.some((id) => id.toString() === user._id.toString())) {
    if (room.occupants.length >= room.capacity) {
      throw new Error("Selected room is full");
    }

    room.occupants.push(user._id);
  }

  user.room = room._id;
  updateRoomStatus(room);
  await room.save();

  return room;
};
