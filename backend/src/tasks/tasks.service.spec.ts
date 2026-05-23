import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from './tasks.gateway';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let gateway: {
    notifyStatusChange: jest.Mock;
    notifyTaskCreated: jest.Mock;
    notifyTaskDeleted: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      task: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    gateway = {
      notifyStatusChange: jest.fn(),
      notifyTaskCreated: jest.fn(),
      notifyTaskDeleted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: TasksGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('throws when task not found', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', 'task-1', { status: TaskStatus.DONE }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('emits websocket event on status change', async () => {
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-1',
      status: TaskStatus.TODO,
    });
    prisma.task.update.mockResolvedValue({
      id: 'task-1',
      status: TaskStatus.IN_PROGRESS,
    });

    await service.update('user-1', 'task-1', {
      status: TaskStatus.IN_PROGRESS,
    });

    expect(gateway.notifyStatusChange).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        id: 'task-1',
        status: TaskStatus.IN_PROGRESS,
      }),
    );
  });
});
