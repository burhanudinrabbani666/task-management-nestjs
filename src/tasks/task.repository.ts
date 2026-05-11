import { DataSource, Repository } from 'typeorm';
import { Task } from './task.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { User } from '../auth/user.entity';

// Empty for now
@Injectable()
export class TaskRepository extends Repository<Task> {
  constructor(private dataSource: DataSource) {
    super(Task, dataSource.createEntityManager());
  }

  public async getTasks(
    filterDto: GetTaskFilterDto,
    user: User,
  ): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.createQueryBuilder('task');
    query.where(`"userId" = :userId`, { userId: user.id });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (filterDto.search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const tasks = await query.getMany();
    return tasks;
  }

  public async getTaskById(id: string, user: User): Promise<Task> {
    const query = this.createQueryBuilder('task');
    query.where(`"userId" = :userId`, { userId: user.id });
    query.andWhere(`id = :id`, { id });

    const task = await query.getOne();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    return task;
  }

  public async createTask(
    createTaskDto: CreateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = this.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.OPEN,
      user, // <-- Add the user
    });

    await this.save(task);
    return task;
  }

  public async deleteTaskById(id: string): Promise<void> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(Task)
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ${id} not found.`);
    }
  }

  public async updateTaskStatusById(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;

    await this.save(task);
    return task;
  }
}
