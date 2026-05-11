import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from '../tasks/task.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  // One to many
  @OneToMany(() => Task, (task) => task.user, { eager: true }) // Auto fetch Task
  tasks?: Task[];
}
