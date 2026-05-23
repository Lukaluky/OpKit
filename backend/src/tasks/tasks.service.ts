import { Injectable, NotFoundException } from '@nestjs/common';
import { Task, TaskStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksGateway: TasksGateway,
  ) {}

  findAll(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        userId,
      },
    });

    this.tasksGateway.notifyTaskCreated(userId, task);
    return task;
  }

  async update(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
    });

    if (dto.status !== undefined && dto.status !== task.status) {
      this.tasksGateway.notifyStatusChange(userId, {
        id: updated.id,
        status: updated.status,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async remove(userId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({ where: { id: taskId } });

    this.tasksGateway.notifyTaskDeleted(userId, {
      id: taskId,
      timestamp: new Date().toISOString(),
    });
  }
}
