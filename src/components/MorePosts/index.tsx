import { GetServerSideProps } from 'next';

import styles from './moreposts.module.scss';

export function MorePosts({ onClick }) {
  return (
    <button type="button" className={styles.readMore} onClick={onClick}>
      Carregar mais posts
    </button>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
